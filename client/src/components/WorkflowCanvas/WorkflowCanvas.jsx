import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NODE_CATEGORIES, getNodeCategory } from '@/lib/nodeTypes';

function AgentNode({ data, type, selected }) {
  const category = getNodeCategory(type);
  const Icon = category.icon;
  return (
    <div
      className={`min-w-[180px] rounded-lg border bg-surface-card px-3 py-2 shadow-md ${
        selected ? 'border-indigo-400' : 'border-surface-border'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-slate-500" />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" style={{ color: category.color }} />
        <span className="truncate text-sm text-slate-100">{data?.label || category.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-slate-500" />
    </div>
  );
}

const nodeTypes = NODE_CATEGORIES.reduce((acc, c) => {
  acc[c.type] = AgentNode;
  return acc;
}, {});

function CanvasInner({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, onAddNode }) {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/agentflow-node');
      if (!nodeType) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onAddNode(nodeType, position);
    },
    [screenToFlowPosition, onAddNode]
  );

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ animated: true }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background gap={20} color="#1f2937" />
        <Controls />
        <MiniMap pannable zoomable className="!bg-surface-card" />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
