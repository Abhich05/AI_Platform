const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const env = require('../config/env');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const orchestrator = require('../agents/orchestrator');

const QUEUE_NAME = 'workflow-execution';

let queue = null;
let worker = null;

function isRedisEnabled() {
  return Boolean(env.REDIS_URL);
}

async function processJob(job) {
  const { workflowId, executionId } = job.data;
  const [workflow, execution] = await Promise.all([Workflow.findById(workflowId), Execution.findById(executionId)]);

  if (!workflow || !execution) {
    throw new Error('Workflow or execution not found for queued job');
  }

  await orchestrator.runWorkflow(workflow, execution);
}

function initQueue() {
  if (!isRedisEnabled()) {
    console.log('[queue] REDIS_URL not set - executions run in-process without a queue');
    return;
  }

  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  queue = new Queue(QUEUE_NAME, { connection });
  worker = new Worker(QUEUE_NAME, processJob, { connection });

  worker.on('failed', async (job, err) => {
    console.error(`[queue] job ${job?.id} failed:`, err.message);
    if (job?.data?.executionId) {
      await Execution.findByIdAndUpdate(job.data.executionId, {
        status: 'FAILED',
        error: { code: 'QUEUE_JOB_FAILED', message: err.message },
        endTime: new Date(),
      }).catch(() => {});
    }
  });

  console.log('[queue] BullMQ worker started using Redis');
}

async function enqueueExecution(workflow, execution) {
  if (queue) {
    await queue.add(
      'run',
      { workflowId: workflow._id.toString(), executionId: execution._id.toString() },
      { attempts: 1 }
    );
    return;
  }

  orchestrator.runWorkflow(workflow, execution).catch(async (err) => {
    console.error('[orchestrator] unhandled error running workflow:', err.message);
    await Execution.findByIdAndUpdate(execution._id, {
      status: 'FAILED',
      error: { code: 'ORCHESTRATOR_ERROR', message: err.message },
      endTime: new Date(),
    });
  });
}

module.exports = { initQueue, enqueueExecution, isRedisEnabled };
