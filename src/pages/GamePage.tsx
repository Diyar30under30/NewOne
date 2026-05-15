import React, { useEffect, useState, useCallback } from 'react';
import { Board } from '../components/Board';
import { Timer } from '../components/Timer';
import { DifficultySelector } from '../components/DifficultySelector';
import { Statistics } from '../components/Statistics';
import { History } from '../components/History';
import { AICoachPanel } from '../components/AICoachPanel';
import { DailyChallenge } from '../components/DailyChallenge';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../hooks/useAuth';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabaseClient';
import type { Stats, GameHistoryEntry, Difficulty } from '../types';
import { GAME_CONFIGS, COIN_REWARDS } from '../lib/utils/constants';
import { RotateCcw, Flag, Bomb, Trophy, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
// Simple confetti without external dependency
const launchConfetti = () => {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#0ea5e9', '#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#f43f5e'];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.2,
  }));

  let frame = 0;
  const animate = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 120) requestAnimationFrame(animate);
    else document.body.removeChild(canvas);
  };
  requestAnimationFrame(animate);
};

export function GamePage() {
  const {
    board, status, difficulty, flagsPlaced, minesTotal,
    initGame, elapsedMs, startTime, endTime,
  } = useGameStore();
  const { user, profile, refreshProfile } = useAuth();
  const { play } = useSound();

  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [gameEndAnimating, setGameEndAnimating] = useState(false);
  const [coinAnimation, setCoinAnimation] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const isDailyRef = React.useRef(false);
  const dailyDateRef = React.useRef<string | null>(null);

  useEffect(() => {
    initGame('medium');
  }, []);

  useEffect(() => {
    if (user) {
      loadStats();
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    if (status === 'won') {
      play('win');
      handleGameWin();
      launchConfetti();
    } else if (status === 'lost') {
      play('explode');
      setGameEndAnimating(true);
      setTimeout(() => setGameEndAnimating(false), 600);
    }
  }, [status]);

  const loadStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    const { data } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setStats(data);
    setStatsLoading(false);
  };

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(50);
    setHistory(data ?? []);
  };

  const handleGameWin = async () => {
    if (!user) return;
    const timeMs = endTime && startTime ? endTime - startTime : elapsedMs;

    // Save daily challenge result before anything else (idempotent RPC)
    if (isDailyRef.current && dailyDateRef.current) {
      await supabase.rpc('save_daily_result', {
        p_user_id: user.id,
        p_date: dailyDateRef.current,
        p_time_ms: timeMs,
      });
      const coinsDaily = COIN_REWARDS.DAILY_CHALLENGE;
      await supabase.from('profiles')
        .update({ coins: (profile?.coins ?? 0) + coinsDaily })
        .eq('id', user.id);
      play('coin');
      setCoinAnimation({ amount: coinsDaily, show: true });
      setTimeout(() => setCoinAnimation(c => ({ ...c, show: false })), 2000);
      toast.success(`📅 Daily Challenge пройден! +${coinsDaily} монет`, { duration: 4000 });
      await Promise.all([loadStats(), loadHistory(), refreshProfile()]);
      return;
    }

    // Standard game win
    const trackableKey = ['easy', 'medium', 'hard', 'blitz'].includes(difficulty);
    const timeKey = `best_time_${difficulty}` as keyof Stats;
    const isRecord = trackableKey && (!stats?.[timeKey] || timeMs < (stats[timeKey] as number));
    const rawCoins = isRecord
      ? (COIN_REWARDS[`RECORD_${difficulty.toUpperCase()}` as keyof typeof COIN_REWARDS] as number | undefined)
      : (COIN_REWARDS[`WIN_${difficulty.toUpperCase()}` as keyof typeof COIN_REWARDS] as number | undefined);
    // Always give at least 5 coins per win
    const coinsEarned = Math.max(COIN_REWARDS.MIN_WIN, rawCoins ?? COIN_REWARDS.WIN_EASY);

    // Save history
    await supabase.from('game_history').insert({
      user_id: user.id,
      difficulty,
      result: 'win',
      time_ms: timeMs,
      played_at: new Date().toISOString(),
    });

    // Update stats
    const currentStats = stats ?? {
      user_id: user.id,
      total_games: 0, wins: 0, losses: 0,
      current_win_streak: 0, longest_win_streak: 0,
    };

    const newStreak = currentStats.current_win_streak + 1;
    const newLongest = Math.max(newStreak, currentStats.longest_win_streak);

    await supabase.from('stats').upsert({
      user_id: user.id,
      total_games: currentStats.total_games + 1,
      wins: currentStats.wins + 1,
      losses: currentStats.losses ?? 0,
      current_win_streak: newStreak,
      longest_win_streak: newLongest,
      ...(isRecord && trackableKey ? { [timeKey]: timeMs } : {}),
    });

    // Add coins
    await supabase.from('profiles')
      .update({ coins: (profile?.coins ?? 0) + coinsEarned })
      .eq('id', user.id);

    play('coin');
    setCoinAnimation({ amount: coinsEarned, show: true });
    setTimeout(() => setCoinAnimation(c => ({ ...c, show: false })), 2000);

    if (isRecord) {
      toast.success(`🏆 Новый рекорд! +${coinsEarned} монет`, { duration: 4000 });
    } else {
      toast.success(`🎉 Победа! +${coinsEarned} монет`, { duration: 3000 });
    }

    await Promise.all([loadStats(), loadHistory(), refreshProfile()]);
  };

  const handleCellOpen = useCallback((hitMine: boolean, won: boolean) => {
    if (!hitMine && !won) play('reveal');
    if (hitMine && user) {
      const timeMs = Date.now() - (startTime ?? Date.now());
      supabase.from('game_history').insert({
        user_id: user.id,
        difficulty,
        result: 'loss',
        time_ms: timeMs,
        played_at: new Date().toISOString(),
      }).then(() => {
        if (stats) {
          supabase.from('stats').upsert({
            user_id: user.id,
            total_games: stats.total_games + 1,
            wins: stats.wins,
            losses: stats.losses + 1,
            current_win_streak: 0,
            longest_win_streak: stats.longest_win_streak,
          });
        }
        loadStats();
        loadHistory();
      });
    }
  }, [play, user, difficulty, startTime, stats]);

  const handleDifficultyChange = (diff: Difficulty) => {
    isDailyRef.current = false;
    dailyDateRef.current = null;
    initGame(diff);
  };

  const handleDailyPlay = (seed: number, date: string) => {
    isDailyRef.current = true;
    dailyDateRef.current = date;
    initGame('custom', seed);
    toast('🎯 Daily Challenge начат!');
  };

  const minesLeft = minesTotal - flagsPlaced;
  const config = GAME_CONFIGS[difficulty];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="lg:grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Main game area */}
          <div className="space-y-4">
            {/* Difficulty */}
            <DifficultySelector current={difficulty} onChange={handleDifficultyChange} />

            {/* Game header */}
            <div className="game-card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Mine counter */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl font-mono font-bold"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--danger)' }}>
                  <Bomb size={16} />
                  <span>{String(minesLeft).padStart(3, '0')}</span>
                </div>

                {/* Status / Restart */}
                <button
                  onClick={() => { isDailyRef.current = false; dailyDateRef.current = null; initGame(difficulty); }}
                  className={clsx(
                    'w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg',
                    status === 'won' ? 'bg-green-500' :
                    status === 'lost' ? 'bg-red-500 animate-shake' :
                    'bg-gradient-to-br from-yellow-400 to-orange-500'
                  )}
                >
                  {status === 'won' ? '😎' :
                   status === 'lost' ? '😵' :
                   status === 'playing' ? '🙂' : '😊'}
                </button>

                {/* Timer */}
                <Timer />
              </div>

              {/* Flags */}
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Flag size={12} style={{ color: 'var(--flag-color)' }} />
                <span>Флаги: {flagsPlaced}/{minesTotal}</span>
                <span className="mx-1">•</span>
                <span>Поле: {config.rows}×{config.cols}</span>
              </div>
            </div>

            {/* WIN / LOSE overlay */}
            {(status === 'won' || status === 'lost') && (
              <div className={clsx(
                'game-card text-center py-6 relative overflow-hidden',
                status === 'won' ? 'border-green-500/50' : 'border-red-500/50'
              )}>
                <div className="text-5xl mb-2">
                  {status === 'won' ? '🏆' : '💥'}
                </div>
                <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                  {status === 'won' ? 'Победа!' : 'Мина!'}
                </h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {status === 'won'
                    ? `Время: ${Math.floor(elapsedMs / 1000)}с`
                    : 'Не повезло. Попробуйте ещё раз!'}
                </p>
                {coinAnimation.show && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-yellow-400 font-bold coin-float">
                    +{coinAnimation.amount} 🪙
                  </div>
                )}
                <button
                  onClick={() => { isDailyRef.current = false; dailyDateRef.current = null; initGame(difficulty); }}
                  className="btn-primary"
                >
                  <RotateCcw size={16} />
                  Играть снова
                </button>
              </div>
            )}

            {/* Board */}
            <div className={clsx('transition-all', gameEndAnimating ? 'animate-shake' : '')}>
              <Board onCellOpen={handleCellOpen} />
            </div>

            {/* Mobile Stats */}
            <div className="lg:hidden space-y-4">
              <AICoachPanel />
              <Statistics stats={stats} loading={statsLoading} />
              <History history={history} />
              <DailyChallenge userId={user?.id} onPlay={handleDailyPlay} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4">
            <AICoachPanel />
            <Statistics stats={stats} loading={statsLoading} />
            <History history={history} />
            <DailyChallenge userId={user?.id} onPlay={handleDailyPlay} />
          </div>
        </div>
      </div>
    </div>
  );
}
