import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameHistoryEntry, Difficulty } from '../types';

const GUEST_COINS_KEY = 'guest_coins';
const GUEST_HISTORY_KEY = 'guest_history';

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

interface GuestStore {
  isGuest: boolean;
  guestName: string;
  coins: number;
  history: GameHistoryEntry[];
  setGuest: (name: string) => void;
  clearGuest: () => void;
  addCoins: (amount: number) => void;
  addHistory: (entry: Omit<GameHistoryEntry, 'id' | 'user_id'>) => void;
}

export const useGuestStore = create<GuestStore>()(
  persist(
    (set, get) => ({
      isGuest: false,
      guestName: '',
      coins: 50,
      history: [],

      setGuest: (name) => set({ isGuest: true, guestName: name, coins: 50, history: [] }),

      clearGuest: () => set({ isGuest: false, guestName: '', coins: 50, history: [] }),

      addCoins: (amount) => set({ coins: Math.max(0, get().coins + amount) }),

      addHistory: (entry) => {
        const full: GameHistoryEntry = {
          ...entry,
          id: randomId(),
          user_id: 'guest',
        };
        set({ history: [full, ...get().history].slice(0, 50) });
      },
    }),
    { name: 'guest-profile' }
  )
);
