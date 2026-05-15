import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
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

const DIFF_OPTIONS: { value: Difficulty; label: string; emoji: string }[] = [
  { value: 'easy',   label: 'Лёгкая',  emoji: '🟢' },
  { value: 'medium', label: 'Средняя', emoji: '🟡' },
  { value: 'hard',   label: 'Сложная', emoji: '🔴' },
];

function formatTime(ms?: number): string {
  if (!ms || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${s}с`;
}

const RANK_STYLES = [
  { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', icon: <Crown size={15} className="text-yellow-400" /> },
  { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', icon: <Medal size={15} className="text-slate-300" /> },
  { bg: 'rgba(180,83,9,0.12)',   border: 'rgba(180,83,9,0.3)',    icon: <Medal size={15} className="text-amber-600" /> },
];

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, [difficulty]);

  const load = async () => {
    if (!isSupabaseConfigured) { setError('not_configured'); return; }
    setLoading(true);
    setError(null);

    try {
      const timeCol = `best_time_${difficulty}`;

      // Explicit join: stats → profiles via user_id FK
      const { data, error: qErr } = await (supabase
        .from('stats')
        .select(`${timeCol}, wins, profiles ( username, avatar_url, city )`)
        .not(timeCol, 'is', null)
        .gt(timeCol, 0)
        .order(timeCol, { ascending: true })
        .limit(20) as unknown as Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>);

      if (qErr) { setError(qErr.message); setLoading(false); return; }

      const mapped: LeaderboardEntry[] = (data ?? []).map((row: Record<string, unknown>, i) => {
        const prof = (row['profiles'] as Record<string, unknown> | null) ?? {};
        return {
          rank: i + 1,
          username: (prof['username'] as string | undefined) ?? 'Аноним',
          avatar_url: prof['avatar_url'] as string | undefined,
          city: prof['city'] as string | undefined,
          best_time: (row[timeCol] as number) ?? 0,
          total_wins: (row['wins'] as number) ?? 0,
        };
      });

      setEntries(mapped);
    } catch {
      setError('network');
    }
    setLoading(false);
  };

  return (
    <div className="game-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Trophy size={18} className="text-yellow-400" />
          Рейтинг
        </h3>
        <div className="flex items-center gap-1">
          {DIFF_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDifficulty(opt.value)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                difficulty === opt.value
                  ? 'text-white'
                  : 'hover:text-white/70'
              )}
              style={difficulty === opt.value
                ? { background: 'var(--gradient-brand)', boxShadow: '0 2px 8px var(--accent-glow)' }
                : { color: 'var(--text-muted)' }}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
          <button
            onClick={load}
            className="p-1.5 rounded-lg transition-all ml-1"
            style={{ color: 'var(--text-muted)' }}
            title="Обновить"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Body */}
      {error === 'not_configured' ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Trophy size={28} className="mx-auto mb-2 opacity-20" />
          <p>Настройте Supabase для просмотра рейтинга</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--danger)' }}>
          <p>Ошибка загрузки: {error}</p>
          <button onClick={load} className="mt-2 text-xs underline" style={{ color: 'var(--accent)' }}>Попробовать снова</button>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <Trophy size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Рекордов пока нет</p>
          <p className="text-xs mt-1 opacity-70">Выиграйте первым и займите #1!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry) => {
            const rankStyle = entry.rank <= 3 ? RANK_STYLES[entry.rank - 1] : null;
            return (
              <div
                key={entry.rank}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={rankStyle
                  ? { background: rankStyle.bg, border: `1px solid ${rankStyle.border}` }
                  : { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }
                }
              >
                {/* Rank */}
                <div className="w-6 flex items-center justify-center shrink-0">
                  {rankStyle ? rankStyle.icon : (
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                  {entry.avatar_url
                    ? <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" />
                    : entry.username[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.username}
                  </div>
                  {entry.city && (
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      📍 {entry.city}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-bold" style={{ color: 'var(--accent)' }}>
                    {formatTime(entry.best_time)}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {entry.total_wins} побед
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
