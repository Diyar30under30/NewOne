import React, { useState, useEffect } from 'react';
import { Board } from '../components/Board';
import { Timer } from '../components/Timer';
import { DailyChallenge } from '../components/DailyChallenge';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { getDailySeed } from '../lib/utils/gameEngine';
import { DAILY_CHALLENGE_CONFIG, COIN_REWARDS } from '../lib/utils/constants';
import { format } from 'date-fns';
import { Calendar, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export function DailyPage() {
  const { initGame, status, elapsedMs, endTime, startTime } = useGameStore();
  const { user, profile, refreshProfile } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = getDailySeed(today);

  const handlePlay = (s: number) => {
    initGame('custom', s);
    setPlaying(true);
    setFinished(false);
  };

  const handleCellOpen = async (hitMine: boolean, won: boolean) => {
    if (!won && !hitMine) return;
    setFinished(true);
    setPlaying(false);

    if (won && user) {
      const timeMs = endTime && startTime ? endTime - startTime : elapsedMs;
      await supabase.from('daily_results').insert({
        user_id: user.id,
        date: today,
        time_ms: timeMs,
        finished_at: new Date().toISOString(),
      });
      await supabase.from('profiles')
        .update({ coins: (profile?.coins ?? 0) + COIN_REWARDS.DAILY_CHALLENGE })
        .eq('id', user.id);
      await refreshProfile();
      toast.success(`🎯 Daily Challenge пройден! +${COIN_REWARDS.DAILY_CHALLENGE} монет`);
    } else if (hitMine) {
      toast.error('Мина! Daily Challenge провален');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Calendar size={20} className="text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Daily Challenge</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {format(new Date(), 'd MMMM yyyy')} • Одна попытка для всех
            </p>
          </div>
        </div>

        {playing && (
          <>
            <div className="game-card flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Daily 12×12</span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>25 мин</span>
              </div>
              <Timer compact />
            </div>
            {(status === 'won' || status === 'lost') && (
              <div className={`game-card text-center py-6 ${status === 'won' ? 'border-green-500/50' : 'border-red-500/50'}`}>
                <div className="text-5xl mb-2">{status === 'won' ? '🏆' : '💥'}</div>
                <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                  {status === 'won' ? `Победа! ${Math.floor(elapsedMs / 1000)}с` : 'Мина!'}
                </h2>
              </div>
            )}
            <Board onCellOpen={handleCellOpen} />
          </>
        )}

        {!playing && (
          <DailyChallenge userId={user?.id} onPlay={handlePlay} />
        )}
      </div>
    </div>
  );
}
