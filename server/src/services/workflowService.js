const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const { AppError } = require('./authService');

function serializeWorkflow(workflow) {
  return {
    id: workflow._id,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    triggerConfig: workflow.triggerConfig,
    nodes: workflow.nodes,
    edges: workflow.edges,
    version: workflow.version,
    tags: workflow.tags,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  };
}

async function list(owner, { page = 1, limit = 20, search = '', status = '' } = {}) {
  const query = { owner };
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Workflow.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Workflow.countDocuments(query),
  ]);

  return {
    items: items.map(serializeWorkflow),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

async function create(owner, { name, description, triggerConfig, nodes, edges, tags }) {
  const workflow = await Workflow.create({
    owner,
    name: name || 'Untitled Workflow',
    description: description || '',
    triggerConfig: triggerConfig || {},
    nodes: nodes || [],
    edges: edges || [],
    tags: tags || [],
  });
  return serializeWorkflow(workflow);
}

async function getById(owner, id) {
  const workflow = await Workflow.findOne({ _id: id, owner });
  if (!workflow) {
    throw new AppError(404, 'WORKFLOW_NOT_FOUND', 'Workflow not found');
  }
  return serializeWorkflow(workflow);
}

async function update(owner, id, updates) {
  const workflow = await Workflow.findOne({ _id: id, owner });
  if (!workflow) {
    throw new AppError(404, 'WORKFLOW_NOT_FOUND', 'Workflow not found');
  }

  const editableFields = ['name', 'description', 'status', 'triggerConfig', 'nodes', 'edges', 'tags'];
  for (const field of editableFields) {
    if (updates[field] !== undefined) {
      workflow[field] = updates[field];
    }
  }
  workflow.version += 1;

  await workflow.save();
  return serializeWorkflow(workflow);
}

async function duplicate(owner, id) {
  const source = await Workflow.findOne({ _id: id, owner });
  if (!source) {
    throw new AppError(404, 'WORKFLOW_NOT_FOUND', 'Workflow not found');
  }

  const copy = await Workflow.create({
    owner,
    name: `${source.name} (Copy)`,
    description: source.description,
    status: 'draft',
    triggerConfig: source.triggerConfig,
    nodes: source.nodes,
    edges: source.edges,
    tags: source.tags,
  });

  return serializeWorkflow(copy);
}

async function remove(owner, id) {
  const workflow = await Workflow.findOneAndDelete({ _id: id, owner });
  if (!workflow) {
    throw new AppError(404, 'WORKFLOW_NOT_FOUND', 'Workflow not found');
  }
}

async function dashboardStats(owner) {
  const [total, active, executionsTotal, executionsToday, completed] = await Promise.all([
    Workflow.countDocuments({ owner }),
    Workflow.countDocuments({ owner, status: 'active' }),
    Execution.countDocuments({ owner }),
    Execution.countDocuments({ owner, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    Execution.countDocuments({ owner, status: 'COMPLETED' }),
  ]);

  const successRate = executionsTotal > 0 ? Math.round((completed / executionsTotal) * 100) : null;

  const recentExecutionDocs = await Execution.find({ owner })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('workflowId workflowSnapshot.name status startTime endTime duration createdAt');

  const recentExecutions = recentExecutionDocs.map((exec) => ({
    id: exec._id,
    workflowId: exec.workflowId,
    workflowName: exec.workflowSnapshot?.name || 'Untitled Workflow',
    status: exec.status,
    startTime: exec.startTime,
    endTime: exec.endTime,
    duration: exec.duration,
    createdAt: exec.createdAt,
  }));

  return {
    activeWorkflows: active,
    totalWorkflows: total,
    executionsToday,
    successRate,
    recentExecutions,
  };
}

module.exports = { list, create, getById, update, duplicate, remove, dashboardStats, serializeWorkflow };
