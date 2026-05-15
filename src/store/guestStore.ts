import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameHistoryEntry } from '../types';

interface GuestStore {
  isGuest: boolean;
  guestName: string;
  guestId: string;
  coins: number;
  wins: number;
  losses: number;
  history: GameHistoryEntry[];
  setGuest: (name: string) => void;
  clearGuest: () => void;
  addCoins: (amount: number) => void;
  addHistory: (entry: Pick<GameHistoryEntry, 'difficulty' | 'result' | 'time_ms' | 'played_at'>) => void;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      isGuest: false,
      guestName: 'Гость',
      guestId: makeGuestId(),
      coins: 50,
      wins: 0,
      losses: 0,
      history: [],

      setGuest: (name) => set({
        isGuest: true,
        guestName: name || 'Гость',
        guestId: get().guestId || makeGuestId(),
        // Don't reset coins/history when just renaming
      }),

      clearGuest: () => set({
        isGuest: false,
        guestName: 'Гость',
        coins: 50,
        wins: 0,
        losses: 0,
        history: [],
      }),

      addCoins: (amount) => set({ coins: Math.max(0, get().coins + amount) }),

      addHistory: (entry) => {
        const full: GameHistoryEntry = {
          ...entry,
          id: randomId(),
          user_id: 'guest',
        };
        const newHistory = [full, ...get().history].slice(0, 50);
        const wins = entry.result === 'win' ? get().wins + 1 : get().wins;
        const losses = entry.result === 'loss' ? get().losses + 1 : get().losses;
        set({ history: newHistory, wins, losses });
      },
    }),
    {
      name: 'minesweeper-guest',
      version: 1,
    }
  )
);
