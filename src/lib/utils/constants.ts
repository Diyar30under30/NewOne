import type { GameConfig, Difficulty } from '../../types';

export const GAME_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: { rows: 9, cols: 9, mines: 10, label: 'Лёгкая' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Средняя' },
  hard: { rows: 16, cols: 30, mines: 99, label: 'Сложная' },
  blitz: { rows: 8, cols: 8, mines: 8, label: 'Блиц 2 мин' },
  custom: { rows: 12, cols: 12, mines: 25, label: 'Особая' },
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-500',
  medium: 'text-yellow-500',
  hard: 'text-red-500',
  blitz: 'text-purple-500',
  custom: 'text-blue-500',
};

export const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-600',
  3: 'text-red-500',
  4: 'text-purple-700',
  5: 'text-red-700',
  6: 'text-cyan-600',
  7: 'text-black',
  8: 'text-gray-600',
};

export const SKIN_IDS = {
  CLASSIC: 'classic',
  CYBERPUNK: 'cyberpunk',
  SPACE: 'space',
  PIXEL: 'pixel',
  XMAS: 'xmas',
  CUTE: 'cute',
};

export const COIN_REWARDS = {
  WIN_EASY: 5,
  WIN_MEDIUM: 15,
  WIN_HARD: 30,
  WIN_BLITZ: 10,
  RECORD_EASY: 25,
  RECORD_MEDIUM: 50,
  RECORD_HARD: 100,
  DAILY_CHALLENGE: 40,
  DAILY_TOP3: 150,
  ACHIEVEMENT: 20,
};

export const ELO_CONFIG = {
  WIN: 30,
  LOSS: 20,
  STARTING: 1000,
};

export const AI_COACH_DELAY_MS = 10000;
export const LONG_PRESS_DURATION = 500;
export const MAX_HISTORY_ITEMS = 50;

export const DAILY_CHALLENGE_CONFIG = {
  rows: 12,
  cols: 12,
  mines: 25,
};
