import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isHydrated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ token: data.token, user: data.user });
        return data.user;
      },

      register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        set({ token: data.token, user: data.user });
        return data.user;
      },

      fetchProfile: async () => {
        if (!get().token) return null;
        const { data } = await api.get('/auth/me');
        set({ user: data.user });
        return data.user;
      },

      updateProfile: async (updates) => {
        const { data } = await api.put('/auth/me', updates);
        set({ user: data.user });
        return data.user;
      },

      logout: () => {
        set({ token: null, user: null });
      },
    }),
    {
      name: 'agentflow-auth',
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
