const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema(
  {
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    executionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Execution', required: true, index: true },
    agentId: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    confidenceScore: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
