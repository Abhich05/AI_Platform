const ExecutionLog = require('../models/ExecutionLog');

async function log({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
  return ExecutionLog.create({ executionId, workflowId, nodeId, agent, level, message, metadata });
}

module.exports = { log };
