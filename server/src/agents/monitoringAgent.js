const ExecutionLog = require('../models/ExecutionLog');
const { getIO } = require('../config/socket');

async function log({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
  const entry = await ExecutionLog.create({ executionId, workflowId, nodeId, agent, level, message, metadata });

  try {
    getIO()
      .to(`execution:${executionId}`)
      .emit('execution:log', {
        id: entry._id,
        executionId,
        workflowId,
        nodeId,
        agent,
        level,
        message,
        metadata,
        createdAt: entry.createdAt,
      });
  } catch (err) {
    // Socket.IO not initialized (e.g. an isolated script run) - the log is already persisted, so this is safe to ignore.
  }

  return entry;
}

module.exports = { log };
