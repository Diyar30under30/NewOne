import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { computeProbabilities, getAIHints } from '../lib/utils/probability';
import type { AIHint } from '../types';
import { AI_COACH_DELAY_MS } from '../lib/utils/constants';

interface AICoachState {
  hints: AIHint[];
  activeHint: AIHint | null;
  proactiveHint: AIHint | null;
}

let coachState: AICoachState = {
  hints: [],
  activeHint: null,
  proactiveHint: null,
};

export function useAICoach(onProactiveHint?: (hint: AIHint) => void) {
  const { board, status } = useGameStore();
  const { aiCoachEnabled } = useUIStore();
  const lastMoveTime = useRef(Date.now());
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aiCoachEnabled || status !== 'playing') return;

    const probs = computeProbabilities(board);
    useGameStore.getState().setCellProbabilities(probs);
    const hints = getAIHints(board);
    coachState.hints = hints;

    lastMoveTime.current = Date.now();

    if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    proactiveTimerRef.current = setTimeout(() => {
      const bestHint = hints.find(h => h.isSafest);
      if (bestHint && onProactiveHint) {
        onProactiveHint(bestHint);
      }
    }, AI_COACH_DELAY_MS);

    return () => {
      if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    };
  }, [board, status, aiCoachEnabled, onProactiveHint]);

  const getHintForCell = useCallback((row: number, col: number): AIHint | null => {
    return coachState.hints.find(h => h.row === row && h.col === col) ?? null;
  }, []);

  const getAllHints = useCallback((): AIHint[] => {
    return coachState.hints;
  }, []);

  const getBestHint = useCallback((): AIHint | null => {
    return coachState.hints.find(h => h.isSafest) ?? null;
  }, []);

  return { getHintForCell, getAllHints, getBestHint };
}
