import { useRef, useCallback } from 'react';
import { useUIStore } from '../store/uiStore';

type SoundType = 'click' | 'flag' | 'explode' | 'win' | 'reveal' | 'coin';

export function useSound() {
  const { soundEnabled } = useUIStore();
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {}
  }, [soundEnabled, getCtx]);

  const play = useCallback((sound: SoundType) => {
    if (!soundEnabled) return;
    switch (sound) {
      case 'click':
        playTone(440, 0.08, 'sine', 0.2);
        break;
      case 'flag':
        playTone(660, 0.12, 'triangle', 0.25);
        setTimeout(() => playTone(880, 0.08, 'triangle', 0.2), 80);
        break;
      case 'explode':
        playTone(80, 0.4, 'sawtooth', 0.5);
        setTimeout(() => playTone(60, 0.3, 'square', 0.4), 100);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((freq, i) => {
          setTimeout(() => playTone(freq, 0.25, 'sine', 0.35), i * 120);
        });
        break;
      case 'reveal':
        playTone(330, 0.06, 'sine', 0.15);
        break;
      case 'coin':
        playTone(880, 0.1, 'sine', 0.3);
        setTimeout(() => playTone(1100, 0.15, 'sine', 0.3), 80);
        break;
    }
  }, [soundEnabled, playTone]);

  return { play, soundEnabled };
}
