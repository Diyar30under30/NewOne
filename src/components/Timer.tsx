import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface TimerProps {
  compact?: boolean;
}

export function Timer({ compact }: TimerProps) {
  const { status, startTime, endTime, updateElapsed, elapsedMs } = useGameStore();
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'playing' && startTime) {
      startRef.current = startTime;
      const tick = () => {
        if (startRef.current) {
          updateElapsed(Date.now() - startRef.current);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (endTime && startTime) {
        updateElapsed(endTime - startTime);
      }
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, startTime, endTime]);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((elapsedMs % 1000) / 10);

  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm font-mono font-bold" style={{ color: 'var(--accent)' }}>
        <Clock size={14} />
        <span>{timeStr}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg"
      style={{ background: 'var(--bg-secondary)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}
    >
      <Clock size={18} />
      <span>{timeStr}</span>
      {status === 'playing' && (
        <span className="text-xs opacity-50">.{String(ms).padStart(2, '0')}</span>
      )}
    </div>
  );
}
