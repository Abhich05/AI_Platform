import { create } from 'zustand';

const STORAGE_KEY = 'agentflow-theme';

function resolveTheme(theme) {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme;
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolveTheme(theme));
}

export const useThemeStore = create((set) => ({
  theme: 'dark',

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  },

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY) || 'dark';
    applyTheme(stored);
    set({ theme: stored });
  },
}));
