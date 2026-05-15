import React, { useRef, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import type { CellData, AIHint } from '../types';
import { LONG_PRESS_DURATION } from '../lib/utils/constants';

interface CellProps {
  cell: CellData;
  skinClass: string;
  onOpen: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
  hint?: AIHint | null;
  showProbability?: boolean;
  cellSize: number;
}

const NUMBER_CLASSES: Record<number, string> = {
  1: 'num-1', 2: 'num-2', 3: 'num-3', 4: 'num-4',
  5: 'num-5', 6: 'num-6', 7: 'num-7', 8: 'num-8',
};

const MINE_EMOJIS_BY_SKIN: Record<string, string> = {
  classic: '💣',
  cyberpunk: '⚡',
  space: '☄️',
  pixel: '💀',
  xmas: '❄️',
  cute: '💖',
};

const FLAG_EMOJIS_BY_SKIN: Record<string, string> = {
  classic: '🚩',
  cyberpunk: '⚠️',
  space: '📡',
  pixel: '🏴',
  xmas: '⭐',
  cute: '🎀',
};

export const Cell = React.memo(function Cell({
  cell, skinClass, onOpen, onFlag, onChord, hint, showProbability, cellSize
}: CellProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressed, setPressed] = useState(false);
  const didLongPress = useRef(false);

  const skinName = skinClass.replace('skin-', '');
  const mineEmoji = MINE_EMOJIS_BY_SKIN[skinName] ?? '💣';
  const flagEmoji = FLAG_EMOJIS_BY_SKIN[skinName] ?? '🚩';

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    didLongPress.current = false;
    setPressed(true);
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onFlag(cell.row, cell.col);
      setPressed(false);
    }, LONG_PRESS_DURATION);
  }, [cell.row, cell.col, onFlag]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current) {
      if (cell.isOpen && cell.neighborCount > 0) {
        onChord(cell.row, cell.col);
      } else {
        onOpen(cell.row, cell.col);
      }
    }
  }, [cell, onOpen, onFlag, onChord]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (cell.isOpen && cell.neighborCount > 0) {
      onChord(cell.row, cell.col);
    } else {
      onOpen(cell.row, cell.col);
    }
  }, [cell, onOpen, onChord]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onFlag(cell.row, cell.col);
  }, [cell.row, cell.col, onFlag]);

  const hintClass = hint
    ? hint.probability === 0 ? 'cell-hint-safe ai-hint-pulse'
    : hint.probability === 1 ? 'cell-hint-danger'
    : hint.probability < 0.2 ? 'cell-hint-safe'
    : hint.probability > 0.7 ? 'cell-hint-danger'
    : 'cell-hint-medium'
    : '';

  const fontSize = cellSize > 28 ? 'text-sm' : cellSize > 20 ? 'text-xs' : 'text-[9px]';

  if (cell.isOpen) {
    if (cell.isMine) {
      return (
        <div
          className={clsx(
            'cell-open flex items-center justify-center select-none rounded-sm transition-all',
            cell.isExploded ? 'bg-red-500 animate-mine-explode' : '',
            skinClass,
            fontSize
          )}
          style={{ width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize }}
        >
          <span className="cell-mine">{mineEmoji}</span>
        </div>
      );
    }
    return (
      <div
        className={clsx('cell-open flex items-center justify-center select-none rounded-sm', skinClass, fontSize)}
        style={{ width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize }}
        onClick={handleClick}
        onDoubleClick={() => onChord(cell.row, cell.col)}
      >
        {cell.neighborCount > 0 && (
          <span className={clsx('font-black leading-none', NUMBER_CLASSES[cell.neighborCount])}>
            {cell.neighborCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'cell-closed flex items-center justify-center select-none rounded-sm cursor-pointer',
        'transition-all duration-100 no-context-menu',
        pressed ? 'scale-90 opacity-75' : '',
        hintClass,
        skinClass,
        fontSize
      )}
      style={{ width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        setPressed(false);
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }}
      title={hint ? hint.reasoning : undefined}
    >
      {cell.isFlagged && <span className="cell-flag animate-flag-wave">{flagEmoji}</span>}
      {cell.isQuestion && <span className="text-yellow-400 font-bold">?</span>}
      {!cell.isFlagged && !cell.isQuestion && showProbability && hint && (
        <span
          className="font-bold text-[9px] leading-none"
          style={{
            color: hint.probability > 0.5 ? '#ef4444' : '#22c55e',
            fontSize: Math.max(7, cellSize * 0.3),
          }}
        >
          {Math.round(hint.probability * 100)}%
        </span>
      )}
    </div>
  );
});
