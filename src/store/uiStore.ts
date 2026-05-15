import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface UIStore {
  theme: Theme;
  soundEnabled: boolean;
  aiCoachEnabled: boolean;
  aiCoachMode: 'beginner' | 'advanced' | 'expert';
  showProbabilities: boolean;
  sidebarOpen: boolean;
  activeSkinId: string;

  setTheme: (theme: Theme) => void;
  toggleSound: () => void;
  toggleAICoach: () => void;
  setAICoachMode: (mode: 'beginner' | 'advanced' | 'expert') => void;
  toggleProbabilities: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSkin: (skinId: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      soundEnabled: true,
      aiCoachEnabled: false,
      aiCoachMode: 'beginner',
      showProbabilities: false,
      sidebarOpen: false,
      activeSkinId: 'classic',

      setTheme: (theme) => set({ theme }),
      toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleAICoach: () => set(s => ({ aiCoachEnabled: !s.aiCoachEnabled })),
      setAICoachMode: (mode) => set({ aiCoachMode: mode }),
      toggleProbabilities: () => set(s => ({ showProbabilities: !s.showProbabilities })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveSkin: (skinId) => set({ activeSkinId: skinId }),
    }),
    {
      name: 'minesweeper-ui',
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        aiCoachEnabled: state.aiCoachEnabled,
        aiCoachMode: state.aiCoachMode,
        activeSkinId: state.activeSkinId,
      }),
    }
  )
);
