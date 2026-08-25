const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const executionQueue = require('../queues/executionQueue');
const { AppError } = require('./authService');

function serializeExecution(exec) {
  return {
    id: exec._id,
    workflowId: exec.workflowId,
    workflowName: exec.workflowSnapshot?.name || 'Untitled Workflow',
    status: exec.status,
    currentNode: exec.currentNode,
    startTime: exec.startTime,
    endTime: exec.endTime,
    duration: exec.duration,
    inputs: exec.inputs,
    outputs: exec.outputs,
    error: exec.error,
    retryCount: exec.retryCount,
    langGraph: exec.langGraph,
    createdAt: exec.createdAt,
    updatedAt: exec.updatedAt,
  };
}

async function triggerExecution(owner, workflowId, inputs = {}) {
  const workflow = await Workflow.findOne({ _id: workflowId, owner });
  if (!workflow) {
    throw new AppError(404, 'WORKFLOW_NOT_FOUND', 'Workflow not found');
  }

  const execution = await Execution.create({
    workflowId: workflow._id,
    owner,
    workflowSnapshot: {
      name: workflow.name,
      nodes: workflow.nodes,
      edges: workflow.edges,
      triggerConfig: workflow.triggerConfig,
      version: workflow.version,
    },
    status: 'PENDING',
    inputs,
  });

  await executionQueue.enqueueExecution(workflow, execution);

  return serializeExecution(execution);
}

async function list(owner, { page = 1, limit = 20, status = '', workflowId = '' } = {}) {
  const query = { owner };
  if (status) query.status = status;
  if (workflowId) query.workflowId = workflowId;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Execution.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Execution.countDocuments(query),
  ]);

  return {
    items: items.map(serializeExecution),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

async function getById(owner, id) {
  const execution = await Execution.findOne({ _id: id, owner });
  if (!execution) {
    throw new AppError(404, 'EXECUTION_NOT_FOUND', 'Execution not found');
  }
  return serializeExecution(execution);
}

async function getTimeline(owner, id) {
  const execution = await Execution.findOne({ _id: id, owner }).select('_id');
  if (!execution) {
    throw new AppError(404, 'EXECUTION_NOT_FOUND', 'Execution not found');
  }
  return ExecutionLog.find({ executionId: id }).sort({ createdAt: 1 });
}

async function pause(owner, id) {
  const execution = await Execution.findOne({ _id: id, owner });
  if (!execution) {
    throw new AppError(404, 'EXECUTION_NOT_FOUND', 'Execution not found');
  }
  if (execution.status !== 'RUNNING') {
    throw new AppError(409, 'INVALID_STATE', 'Only a running execution can be paused');
  }
  execution.status = 'PAUSED';
  await execution.save();
  return serializeExecution(execution);
}

async function resume(owner, id) {
  const execution = await Execution.findOne({ _id: id, owner });
  if (!execution) {
    throw new AppError(404, 'EXECUTION_NOT_FOUND', 'Execution not found');
  }
  if (execution.status !== 'PAUSED') {
    throw new AppError(409, 'INVALID_STATE', 'Only a paused execution can be resumed');
  }
  execution.status = 'RUNNING';
  await execution.save();
  return serializeExecution(execution);
}

async function cancel(owner, id) {
  const execution = await Execution.findOne({ _id: id, owner });
  if (!execution) {
    throw new AppError(404, 'EXECUTION_NOT_FOUND', 'Execution not found');
  }
  if (!['RUNNING', 'PAUSED', 'PENDING'].includes(execution.status)) {
    throw new AppError(409, 'INVALID_STATE', 'Execution cannot be cancelled from its current state');
  }
  execution.status = 'CANCELLED';
  await execution.save();
  return serializeExecution(execution);
}

module.exports = { triggerExecution, list, getById, getTimeline, pause, resume, cancel, serializeExecution };
