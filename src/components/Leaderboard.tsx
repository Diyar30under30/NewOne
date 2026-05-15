import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Difficulty } from '../types';
import { clsx } from 'clsx';

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_url?: string;
  city?: string;
  best_time: number;
  total_wins: number;
}

const DIFF_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '🟢 Лёгкая' },
  { value: 'medium', label: '🟡 Средняя' },
  { value: 'hard', label: '🔴 Сложная' },
];

function formatTime(ms?: number): string {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const RANK_ICONS = [
  <Crown size={16} className="text-yellow-400" />,
  <Medal size={16} className="text-gray-300" />,
  <Medal size={16} className="text-amber-600" />,
];

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [difficulty]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const timeCol = `best_time_${difficulty}`;
    const { data } = await supabase
      .from('stats')
      .select(`${timeCol}, wins, profiles(username, avatar_url, city)`)
      .not(timeCol, 'is', null)
      .order(timeCol, { ascending: true })
      .limit(20);

    if (data) {
      const mapped = (data as unknown as Record<string, unknown>[]).map((row, i) => {
        const prof = (row['profiles'] as Record<string, unknown>) ?? {};
        return {
          rank: i + 1,
          username: (prof['username'] as string) ?? 'Аноним',
          avatar_url: prof['avatar_url'] as string | undefined,
          city: prof['city'] as string | undefined,
          best_time: (row[timeCol] as number) ?? 0,
          total_wins: (row['wins'] as number) ?? 0,
        };
      });
      setEntries(mapped);
    }
    setLoading(false);
  };

  return (
    <div className="game-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Trophy size={18} className="text-yellow-400" />
          Рейтинг
        </h3>
        <div className="flex gap-1">
          {DIFF_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                difficulty === opt.value ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-xl bg-gray-700/50 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
          <Trophy size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Пока нет рекордов</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={clsx(
                'flex items-center gap-3 p-2.5 rounded-xl',
                entry.rank === 1 ? 'bg-yellow-500/15 border border-yellow-500/30' :
                entry.rank === 2 ? 'bg-gray-400/10 border border-gray-400/20' :
                entry.rank === 3 ? 'bg-amber-600/10 border border-amber-600/20' : ''
              )}
              style={entry.rank > 3 ? { background: 'var(--bg-secondary)' } : undefined}
            >
              <div className="w-6 flex items-center justify-center">
                {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : (
                  <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    {entry.rank}
                  </span>
                )}
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {entry.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {entry.username}
                </div>
                {entry.city && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {entry.city}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-bold text-blue-400">
                  {formatTime(entry.best_time)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {entry.total_wins} побед
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
