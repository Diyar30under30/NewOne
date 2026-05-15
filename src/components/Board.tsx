import React, { useMemo, useEffect, useRef } from 'react';
import { Cell } from './Cell';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { useAICoach } from '../hooks/useAICoach';
import type { AIHint } from '../types';
import { GAME_CONFIGS } from '../lib/utils/constants';
import toast from 'react-hot-toast';

interface BoardProps {
  onCellOpen?: (hitMine: boolean, won: boolean) => void;
  onCellFlag?: () => void;
  externalHints?: AIHint[];
  isMultiplayer?: boolean;
}

export const Board = React.memo(function Board({ onCellOpen, onCellFlag, externalHints, isMultiplayer }: BoardProps) {
  const { board, status, difficulty, handleCellClick, handleCellFlag, handleChordClick } = useGameStore();
  const { aiCoachEnabled, showProbabilities, activeSkinId } = useUIStore();
  const boardRef = useRef<HTMLDivElement>(null);

  const proactiveHintCallback = React.useCallback((hint: AIHint) => {
    if (status === 'playing') {
      toast(hint.reasoning, {
        icon: '🤖',
        duration: 5000,
        style: { maxWidth: '300px', fontSize: '13px' },
      });
    }
  }, [status]);

  const { getHintForCell, getAllHints } = useAICoach(aiCoachEnabled ? proactiveHintCallback : undefined);

  const hints = externalHints ?? (aiCoachEnabled ? getAllHints() : []);
  const hintMap = useMemo(() => {
    const map = new Map<string, AIHint>();
    hints.forEach(h => map.set(`${h.row},${h.col}`, h));
    return map;
  }, [hints]);

  const config = GAME_CONFIGS[difficulty];

  const cellSize = useMemo(() => {
    if (typeof window === 'undefined') return 32;
    const vw = window.innerWidth;
    const maxWidth = Math.min(vw - 32, 720);
    const cols = config.cols;
    const gap = 2;
    const padding = 16;
    const size = Math.floor((maxWidth - padding * 2 - gap * (cols - 1)) / cols);
    return Math.min(38, Math.max(14, size));
  }, [config.cols]);

  const handleOpen = React.useCallback((row: number, col: number) => {
    const result = handleCellClick(row, col);
    onCellOpen?.(result.hitMine, result.won);
  }, [handleCellClick, onCellOpen]);

  const handleFlag = React.useCallback((row: number, col: number) => {
    handleCellFlag(row, col);
    onCellFlag?.();
  }, [handleCellFlag, onCellFlag]);

  const handleChord = React.useCallback((row: number, col: number) => {
    const result = handleChordClick(row, col);
    onCellOpen?.(result.hitMine, result.won);
  }, [handleChordClick, onCellOpen]);

  if (board.length === 0) return null;

  const skinClass = `skin-${activeSkinId}`;

  return (
    <div className="flex justify-center overflow-auto pb-2" ref={boardRef}>
      <div
        className={`mine-grid ${skinClass}`}
        style={{
          gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
        }}
      >
        {board.map(row =>
          row.map(cell => (
            <Cell
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              skinClass={skinClass}
              onOpen={handleOpen}
              onFlag={handleFlag}
              onChord={handleChord}
              hint={hintMap.get(`${cell.row},${cell.col}`)}
              showProbability={showProbabilities && aiCoachEnabled}
              cellSize={cellSize}
            />
          ))
        )}
      </div>
    </div>
  );
});
