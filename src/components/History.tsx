import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { GameHistoryEntry, Difficulty } from '../types';
import { clsx } from 'clsx';

interface HistoryProps {
  history: GameHistoryEntry[];
  loading?: boolean;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Лёгкая',
  medium: 'Средняя',
  hard: 'Сложная',
  blitz: 'Блиц',
  custom: 'Особая',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
  blitz: 'text-purple-400',
  custom: 'text-blue-400',
};

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}м ${s % 60}с` : `${s}с`;
}

export function History({ history, loading }: HistoryProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 rounded-xl bg-gray-700/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>История пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {history.slice(0, 20).map((entry) => (
        <div
          key={entry.id}
          className={clsx(
            'flex items-center justify-between p-2.5 rounded-xl border text-xs',
            entry.result === 'win'
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          )}
        >
          <div className="flex items-center gap-2">
            {entry.result === 'win'
              ? <CheckCircle size={14} className="text-green-400 shrink-0" />
              : <XCircle size={14} className="text-red-400 shrink-0" />
            }
            <span className={DIFFICULTY_COLORS[entry.difficulty]}>
              {DIFFICULTY_LABELS[entry.difficulty]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
              {formatTime(entry.time_ms)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {format(new Date(entry.played_at), 'dd MMM', { locale: ru })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
