import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getDailySeed, createEmptyBoard, placeMines } from '../lib/utils/gameEngine';
import { DAILY_CHALLENGE_CONFIG } from '../lib/utils/constants';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface DailyEntry {
  rank: number;
  username: string;
  time_ms: number;
  accuracy?: number;
}

interface DailyChallengeProps {
  userId?: string;
  onPlay: (seed: number, date: string) => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function DailyChallenge({ userId, onPlay }: DailyChallengeProps) {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<DailyEntry[]>([]);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [myResult, setMyResult] = useState<{ time_ms: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = getDailySeed(today);

  useEffect(() => {
    loadData();
    const timer = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [userId]);

  const updateTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  };

  const loadData = async () => {
    setLoading(true);
    if (userId) {
      const { data: myData } = await supabase
        .from('daily_results')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      if (myData) {
        setAlreadyPlayed(true);
        setMyResult(myData);
      }
    }

    const { data } = await supabase
      .from('daily_results')
      .select('time_ms, accuracy, profiles(username)')
      .eq('date', today)
      .order('time_ms', { ascending: true })
      .limit(10);

    if (data) {
      const entries = data.map((row: Record<string, unknown>, i: number) => {
        const prof = (row['profiles'] as Record<string, string>) ?? {};
        return {
          rank: i + 1,
          username: prof['username'] ?? 'Аноним',
          time_ms: row['time_ms'] as number,
          accuracy: row['accuracy'] as number | undefined,
        };
      });
      setLeaderboard(entries);
    }
    setLoading(false);
  };

  const handlePlay = () => {
    if (!userId) {
      navigate('/auth');
      return;
    }
    if (alreadyPlayed) {
      toast('Вы уже сыграли сегодня!', { icon: '📅' });
      return;
    }
    onPlay(seed, today);
  };

  return (
    <div className="game-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Calendar size={18} className="text-orange-400" />
          Задание дня
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 font-mono text-sm text-orange-400">
          <Clock size={14} />
          {timeLeft}
        </div>
      </div>

      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-semibold">{format(new Date(), 'd MMMM yyyy', { locale: ru })}</span>
        {' — '}поле 12×12, 25 мин. Одна попытка!
      </div>

      {/* Config info */}
      <div className="flex gap-2">
        {[
          { label: `${DAILY_CHALLENGE_CONFIG.rows}×${DAILY_CHALLENGE_CONFIG.cols}`, icon: '🗺️' },
          { label: `${DAILY_CHALLENGE_CONFIG.mines} мин`, icon: '💣' },
          { label: 'Общий для всех', icon: '🌍' },
        ].map(({ label, icon }) => (
          <div key={label} className="flex-1 flex flex-col items-center p-2 rounded-xl text-xs" style={{ background: 'var(--bg-secondary)' }}>
            <span className="text-base">{icon}</span>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* My result */}
      {myResult && (
        <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30">
          <div className="text-xs text-blue-300 mb-1">Ваш результат сегодня:</div>
          <div className="font-bold text-blue-400 text-lg">{formatTime(myResult.time_ms)}</div>
        </div>
      )}

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={alreadyPlayed}
        className={clsx(
          'w-full py-3 rounded-xl font-bold text-sm transition-all',
          alreadyPlayed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'btn-primary'
        )}
      >
        {alreadyPlayed ? '✅ Сыграно сегодня' : !userId ? '🔐 Войдите для участия' : '🎯 Играть!'}
      </button>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Trophy size={12} className="text-yellow-400" /> Сегодняшний рейтинг
          </div>
          <div className="space-y-1.5">
            {leaderboard.map(entry => (
              <div key={entry.rank} className="flex items-center gap-2 text-xs">
                <span className="w-5 text-center font-bold" style={{ color: 'var(--text-muted)' }}>
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                </span>
                <span className="flex-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {entry.username}
                </span>
                <span className="font-mono font-bold text-orange-400">
                  {formatTime(entry.time_ms)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
