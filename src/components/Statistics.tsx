import React from 'react';
import { Trophy, Target, Flame, BarChart2, Clock } from 'lucide-react';
import type { Stats } from '../types';
import { clsx } from 'clsx';

interface StatisticsProps {
  stats: Stats | null;
  loading?: boolean;
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-white', color)}>
        {icon}
      </div>
      <div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}

function formatTime(ms?: number): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}м ${s % 60}с` : `${s}с`;
}

export function Statistics({ stats, loading }: StatisticsProps) {
  if (loading) {
    return (
      <div className="game-card space-y-3">
        <div className="h-5 rounded bg-gray-700/50 animate-pulse w-32" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 rounded-xl bg-gray-700/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="game-card text-center py-8">
        <BarChart2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Сыграйте первую партию!</p>
      </div>
    );
  }

  const winRate = stats.total_games > 0
    ? Math.round((stats.wins / stats.total_games) * 100)
    : 0;

  return (
    <div className="game-card space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <BarChart2 size={16} style={{ color: 'var(--accent)' }} />
        Статистика
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<Trophy size={16} />} label="Победы" value={stats.wins} color="bg-yellow-500" />
        <StatCard icon={<Target size={16} />} label="% побед" value={`${winRate}%`} color="bg-blue-500" />
        <StatCard icon={<Flame size={16} />} label="Стрик" value={stats.current_win_streak} color="bg-orange-500" />
        <StatCard icon={<BarChart2 size={16} />} label="Игр всего" value={stats.total_games} color="bg-purple-500" />
      </div>

      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Лучшее время</div>
        {[
          { label: '🟢 Лёгкая', time: stats.best_time_easy },
          { label: '🟡 Средняя', time: stats.best_time_medium },
          { label: '🔴 Сложная', time: stats.best_time_hard },
        ].map(({ label, time }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>
              {formatTime(time)}
            </span>
          </div>
        ))}
      </div>

      {stats.longest_win_streak > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <span className="text-lg">🏆</span>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Лучший стрик</div>
            <div className="text-sm font-bold text-yellow-400">{stats.longest_win_streak} побед</div>
          </div>
        </div>
      )}
    </div>
  );
}
