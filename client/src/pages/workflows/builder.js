import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useNodesState, useEdgesState } from '@xyflow/react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import PromptInputPanel from '@/components/PromptInputPanel/PromptInputPanel';
import GraphPreviewPanel from '@/components/GraphPreviewPanel/GraphPreviewPanel';
import WorkflowToolbar from '@/components/WorkflowToolbar/WorkflowToolbar';
import WorkflowCanvas from '@/components/WorkflowCanvas/WorkflowCanvas';
import { useWorkflowStore } from '@/store/workflowStore';

export default function WorkflowBuilder() {
  const router = useRouter();
  const { generateFromPrompt, createWorkflow } = useWorkflowStore();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const runGeneration = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateFromPrompt(prompt);
      setGenerated(result);
      setNodes(result.nodes);
      setEdges(result.edges);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, generateFromPrompt, setNodes, setEdges]);

  const handleSave = async () => {
    if (!generated) return;
    setIsSaving(true);
    try {
      const workflow = await createWorkflow({
        name: generated.name,
        description: generated.description,
        nodes,
        edges,
        tags: generated.tags,
      });
      router.push(`/workflows/${workflow.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex h-full flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold">Generate a workflow</h1>
              <p className="mt-1 text-sm text-slate-400">
                Describe an automation in plain English and we'll turn it into a runnable graph.
              </p>
            </div>
            <WorkflowToolbar
              hasWorkflow={!!generated}
              isSaving={isSaving}
              onRegenerate={runGeneration}
              onSave={handleSave}
            />
          </div>

          <div className="mb-4 space-y-4">
            <PromptInputPanel
              prompt={prompt}
              onChangePrompt={setPrompt}
              onGenerate={runGeneration}
              isGenerating={isGenerating}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <GraphPreviewPanel workflow={generated} />
          </div>

          {generated && (
            <div className="min-h-[320px] flex-1 overflow-hidden rounded-lg border border-surface-border">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={() => {}}
                onNodeClick={() => {}}
                onPaneClick={() => {}}
                onAddNode={() => {}}
              />
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
