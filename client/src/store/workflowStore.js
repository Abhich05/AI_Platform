import { create } from 'zustand';
import api from '@/services/api';

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 1 },
  isLoadingList: false,

  current: null,
  isLoadingCurrent: false,
  isSaving: false,

  fetchWorkflows: async ({ page = 1, search = '', status = '' } = {}) => {
    set({ isLoadingList: true });
    try {
      const { data } = await api.get('/workflows', { params: { page, search, status } });
      set({ workflows: data.items, pagination: data.pagination });
      return data;
    } finally {
      set({ isLoadingList: false });
    }
  },

  fetchWorkflow: async (id) => {
    set({ isLoadingCurrent: true });
    try {
      const { data } = await api.get(`/workflows/${id}`);
      set({ current: data.workflow });
      return data.workflow;
    } finally {
      set({ isLoadingCurrent: false });
    }
  },

  createWorkflow: async (payload = {}) => {
    const { data } = await api.post('/workflows', payload);
    return data.workflow;
  },

  updateCurrent: async (updates) => {
    const current = get().current;
    if (!current) return null;
    set({ isSaving: true });
    try {
      const { data } = await api.put(`/workflows/${current.id}`, updates);
      set({ current: data.workflow });
      return data.workflow;
    } finally {
      set({ isSaving: false });
    }
  },

  setNodes: (nodes) => {
    const current = get().current;
    if (!current) return;
    set({ current: { ...current, nodes } });
  },

  setEdges: (edges) => {
    const current = get().current;
    if (!current) return;
    set({ current: { ...current, edges } });
  },

  duplicateWorkflow: async (id) => {
    const { data } = await api.post(`/workflows/${id}/duplicate`);
    return data.workflow;
  },

  generateFromPrompt: async (prompt) => {
    const { data } = await api.post('/workflows/generate', { prompt });
    return data;
  },

  deleteWorkflow: async (id) => {
    await api.delete(`/workflows/${id}`);
  },
}));
