const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workflowSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    currentNode: { type: String, default: null },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: null },
    inputs: { type: mongoose.Schema.Types.Mixed, default: {} },
    outputs: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: mongoose.Schema.Types.Mixed, default: null },
    retryCount: { type: Number, default: 0 },
    langGraph: { type: String, enum: ['available', 'not-installed'], default: 'not-installed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Execution', executionSchema);
