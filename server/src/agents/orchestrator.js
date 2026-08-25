const Execution = require('../models/Execution');
const Notification = require('../models/Notification');
const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');

let langGraphAvailable = false;
try {
  require('@langchain/langgraph');
  langGraphAvailable = true;
} catch (err) {
  langGraphAvailable = false;
}

function getLangGraphStatus() {
  return langGraphAvailable ? 'available' : 'not-installed';
}

const POLL_INTERVAL_MS = 500;

async function waitWhilePaused(executionId) {
  for (;;) {
    const fresh = await Execution.findById(executionId).select('status');
    if (!fresh || fresh.status !== 'PAUSED') {
      return fresh?.status;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function executeNode(node, execCtx) {
  const { executionId, workflowId, owner, context } = execCtx;

  await monitoringAgent.log({
    executionId,
    workflowId,
    nodeId: node.id,
    agent: 'execution',
    level: 'info',
    message: `Executing node "${node.data?.label || node.type}"`,
  });

  let attempt = 0;
  for (;;) {
    try {
      const output = await executionAgent.runNode(node, context, owner);
      const { valid, missing } = validationAgent.validate(node, output);
      if (!valid) {
        const err = new Error(`Missing required output fields: ${missing.join(', ')}`);
        err.code = 'VALIDATION_FAILED';
        throw err;
      }

      await monitoringAgent.log({
        executionId,
        workflowId,
        nodeId: node.id,
        agent: 'validation',
        level: 'success',
        message: `Node "${node.data?.label || node.type}" completed`,
        metadata: { output },
      });

      context[node.id] = output;
      return { success: true, output };
    } catch (err) {
      const classification = recoveryAgent.classify(err);
      const decision = recoveryAgent.decide(classification, attempt);

      await monitoringAgent.log({
        executionId,
        workflowId,
        nodeId: node.id,
        agent: 'recovery',
        level: decision === 'retry_with_backoff' ? 'warning' : 'error',
        message: `${classification}: ${err.message} -> ${decision}`,
        metadata: { classification, decision, code: err.code, attempt },
      });

      if (decision === 'retry_with_backoff') {
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }

      return { success: false, error: { code: err.code || 'UNKNOWN', message: err.message, classification } };
    }
  }
}

async function runWorkflow(workflow, execution) {
  const { order, confidence, hasCycle } = plannerAgent.plan(workflow);

  await monitoringAgent.log({
    executionId: execution._id,
    workflowId: workflow._id,
    agent: 'planner',
    level: hasCycle ? 'error' : 'info',
    message: hasCycle
      ? 'Workflow graph contains a cycle; execution order may be incomplete'
      : `Planned execution order for ${order.length} node(s)`,
    metadata: { confidence, order: order.map((n) => n.id), hasCycle },
  });

  execution.status = 'RUNNING';
  execution.startTime = new Date();
  execution.langGraph = getLangGraphStatus();
  await execution.save();

  const context = {};
  let failure = hasCycle
    ? { code: 'PLANNING_FAILED', message: 'Workflow graph contains a cycle', classification: 'MISSING_FIELDS' }
    : null;
  let cancelled = false;

  if (!failure) {
    for (const node of order) {
      const statusBeforeNode = await waitWhilePaused(execution._id);
      if (statusBeforeNode === 'CANCELLED') {
        cancelled = true;
        break;
      }

      execution.currentNode = node.id;
      await execution.save();

      const result = await executeNode(node, {
        executionId: execution._id,
        workflowId: workflow._id,
        owner: execution.owner,
        context,
      });

      if (!result.success) {
        failure = result.error;
        break;
      }
    }
  }

  const fresh = await Execution.findById(execution._id).select('status');
  if (fresh?.status === 'CANCELLED') {
    cancelled = true;
  }

  execution.endTime = new Date();
  execution.duration = execution.endTime - execution.startTime;
  execution.outputs = context;

  if (cancelled) {
    execution.status = 'CANCELLED';
  } else if (failure) {
    execution.status = 'FAILED';
    execution.error = failure;
  } else {
    execution.status = 'COMPLETED';
  }

  await execution.save();

  await monitoringAgent.log({
    executionId: execution._id,
    workflowId: workflow._id,
    agent: 'monitoring',
    level: cancelled ? 'warning' : failure ? 'error' : 'success',
    message: cancelled
      ? 'Execution cancelled'
      : failure
      ? `Execution failed: ${failure.message}`
      : 'Execution completed successfully',
  });

  await Notification.create({
    owner: execution.owner,
    workflowId: workflow._id,
    executionId: execution._id,
    type: cancelled ? 'info' : failure ? 'escalation' : 'success',
    title: `Workflow "${workflow.name}" ${cancelled ? 'cancelled' : failure ? 'failed' : 'completed'}`,
    message: cancelled
      ? 'Execution was cancelled by the user.'
      : failure
      ? failure.message
      : `Executed ${order.length} node(s) successfully.`,
  });

  return execution;
}

module.exports = { runWorkflow, getLangGraphStatus };
