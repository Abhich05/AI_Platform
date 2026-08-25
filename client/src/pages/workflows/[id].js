import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import { ArrowLeft, Save, Copy, Play } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import NodePalette from '@/components/NodePalette/NodePalette';
import NodeConfigPanel from '@/components/NodeConfigPanel/NodeConfigPanel';
import WorkflowCanvas from '@/components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '@/store/workflowStore';
import { getNodeCategory } from '@/lib/nodeTypes';
import api from '@/services/api';

function genId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function WorkflowEditor() {
  const router = useRouter();
  const { id } = router.query;
  const { current, isLoadingCurrent, fetchWorkflow, updateCurrent, duplicateWorkflow } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (id) fetchWorkflow(id);
  }, [id, fetchWorkflow]);

  useEffect(() => {
    if (current) {
      setNodes(current.nodes || []);
      setEdges(current.edges || []);
      setName(current.name);
      setStatus(current.status);
    }
  }, [current, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, id: genId('edge'), animated: true }, eds)),
    [setEdges]
  );

  const onAddNode = useCallback(
    (nodeType, position) => {
      const category = getNodeCategory(nodeType);
      const newNode = {
        id: genId('node'),
        type: nodeType,
        position,
        data: { label: category.label, config: {} },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleChangeLabel = (label) => {
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label } } : n)));
  };

  const handleChangeConfig = (config) => {
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, config } } : n)));
  };

  const handleDeleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCurrent({ name, status, nodes, edges });
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    const copy = await duplicateWorkflow(id);
    router.push(`/workflows/${copy.id}`);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await updateCurrent({ name, status, nodes, edges });
      const { data } = await api.post(`/workflows/${id}/execute`);
      router.push(`/executions/${data.execution.id}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoadingCurrent || !current) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="h-full animate-pulse rounded-lg border border-surface-border bg-surface-card" />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex h-full flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => router.push('/workflows')}
                className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-slate-100 outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-md border border-surface-border bg-surface-card px-2 py-1 text-xs outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
              <span className="shrink-0 text-xs text-slate-500">v{current.version}</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {savedAt && <span className="text-xs text-slate-500">Saved {savedAt.toLocaleTimeString()}</span>}
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || nodes.length === 0}
                className="flex items-center gap-1.5 rounded-md border border-green-500/30 px-3 py-1.5 text-sm text-green-400 hover:bg-green-500/10 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isExecuting ? 'Starting...' : 'Execute'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden rounded-lg border border-surface-border">
            <NodePalette />
            <div className="flex-1">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                onAddNode={onAddNode}
              />
            </div>
            <NodeConfigPanel
              node={selectedNode}
              onChangeLabel={handleChangeLabel}
              onChangeConfig={handleChangeConfig}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
