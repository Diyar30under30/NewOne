import React from 'react';
import { clsx } from 'clsx';
import type { Difficulty } from '../types';
import { GAME_CONFIGS, COIN_REWARDS } from '../lib/utils/constants';
import { Zap, Grid, Layers, Crosshair, Timer } from 'lucide-react';

interface DifficultySelectorProps {
  current: Difficulty;
  onChange: (d: Difficulty) => void;
}

const ICONS: Record<Difficulty, React.ReactNode> = {
  easy: <Grid size={16} />,
  medium: <Layers size={16} />,
  hard: <Crosshair size={16} />,
  blitz: <Zap size={16} />,
  custom: <Timer size={16} />,
};

const COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30',
  blitz: 'bg-purple-500/20 text-purple-400 border-purple-500/40 hover:bg-purple-500/30',
  custom: 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30',
};

const ACTIVE_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30',
  medium: 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30',
  hard: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30',
  blitz: 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/30',
  custom: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30',
};

const WIN_COINS: Partial<Record<Difficulty, number>> = {
  easy: COIN_REWARDS.WIN_EASY,
  medium: COIN_REWARDS.WIN_MEDIUM,
  hard: COIN_REWARDS.WIN_HARD,
  blitz: COIN_REWARDS.WIN_BLITZ,
};

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'blitz'];

export function DifficultySelector({ current, onChange }: DifficultySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {DIFFICULTIES.map(diff => {
        const config = GAME_CONFIGS[diff];
        const isActive = diff === current;
        const coins = WIN_COINS[diff];
        return (
          <button
            key={diff}
            onClick={() => onChange(diff)}
            className={clsx(
              'flex flex-col items-center px-3 py-2 rounded-xl border font-semibold text-xs transition-all duration-200 active:scale-95 gap-0.5',
              isActive ? ACTIVE_COLORS[diff] : COLORS[diff]
            )}
          >
            <div className="flex items-center gap-1.5">
              {ICONS[diff]}
              <span>{config.label}</span>
            </div>
            <div className="flex items-center gap-1 opacity-80">
              <span className="hidden sm:inline">
                {config.rows}×{config.cols}, {config.mines}💣 ·
              </span>
              <span>🪙 {coins}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
