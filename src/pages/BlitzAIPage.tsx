import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  createEmptyBoard, placeMines, openCell, checkWin,
  revealAllMines, forEachNeighbor, generateSeed,
} from '../lib/utils/gameEngine';
import { GAME_CONFIGS } from '../lib/utils/constants';
import type { CellData } from '../types';
import { RotateCcw, Bot, User } from 'lucide-react';

// ── Difficulty config for blitz ──────────────────────────────────────────────
const CONFIG = GAME_CONFIGS.blitz; // 8×8, 8 mines

// ── Number colors ────────────────────────────────────────────────────────────
const NUM_COLORS: Record<number, string> = {
  1: '#5B8DD9', 2: '#22c55e', 3: '#C4775A', 4: '#7c3aed',
  5: '#dc2626', 6: '#0891b2', 7: '#374151', 8: '#9ca3af',
};

// ── AI solver: returns array of deduced moves ────────────────────────────────
function getAIMoves(board: CellData[][]): { row: number; col: number; action: 'open' | 'flag' }[] {
  const moves: { row: number; col: number; action: 'open' | 'flag' }[] = [];
  const rows = board.length;
  const cols = board[0].length;
  const seen = new Set<string>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isOpen || cell.isMine || cell.neighborCount === 0) continue;

      const closed: CellData[] = [];
      let flagged = 0;
      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        const n = board[nr][nc];
        if (n.isFlagged) flagged++;
        else if (!n.isOpen) closed.push(n);
      });

      const remaining = cell.neighborCount - flagged;

      if (remaining === 0) {
        // All mines flagged → open closed neighbors
        closed.forEach(n => {
          const k = `${n.row},${n.col}`;
          if (!seen.has(k)) { seen.add(k); moves.push({ row: n.row, col: n.col, action: 'open' }); }
        });
      } else if (remaining === closed.length && closed.length > 0) {
        // All closed neighbors are mines → flag them
        closed.forEach(n => {
          const k = `${n.row},${n.col}`;
          if (!seen.has(k)) { seen.add(k); moves.push({ row: n.row, col: n.col, action: 'flag' }); }
        });
      }
    }
  }
  return moves;
}

// When no deductions possible, pick best guess (most revealed neighbors)
function getAIGuess(board: CellData[][]): { row: number; col: number } | null {
  const rows = board.length;
  const cols = board[0].length;
  let best: { row: number; col: number } | null = null;
  let bestScore = -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (cell.isOpen || cell.isFlagged) continue;
      let openNeighbors = 0;
      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        if (board[nr][nc].isOpen) openNeighbors++;
      });
      if (openNeighbors > bestScore) {
        bestScore = openNeighbors;
        best = { row: r, col: c };
      }
    }
  }
  return best;
}

// ── Mini board renderer ──────────────────────────────────────────────────────
const CELL_SIZE = 36;

function MiniBoard({
  board, onOpen, onFlag, disabled,
}: {
  board: CellData[][];
  onOpen?: (r: number, c: number) => void;
  onFlag?: (r: number, c: number) => void;
  disabled?: boolean;
}) {
  if (!board.length) return null;
  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: 'var(--border-color)', display: 'inline-block' }}
    >
      {board.map((row, ri) => (
        <div key={ri} style={{ display: 'flex' }}>
          {row.map((cell) => {
            let bg = 'var(--bg-secondary)';
            const border = '1px solid var(--border-color)';
            if (cell.isOpen && !cell.isMine) bg = 'var(--bg-tertiary, #f5f0e8)';
            if (cell.isOpen && cell.isMine && cell.isExploded) bg = '#ef4444';
            if (cell.isOpen && cell.isMine && !cell.isExploded) bg = '#f97316';

            return (
              <div
                key={cell.col}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: bg,
                  border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: disabled || cell.isOpen ? 'default' : 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  userSelect: 'none',
                  transition: 'background 0.1s',
                }}
                onClick={() => !disabled && !cell.isOpen && !cell.isFlagged && onOpen?.(cell.row, cell.col)}
                onContextMenu={(e) => { e.preventDefault(); !disabled && !cell.isOpen && onFlag?.(cell.row, cell.col); }}
              >
                {cell.isOpen && cell.isMine && '💣'}
                {cell.isOpen && !cell.isMine && cell.neighborCount > 0 && (
                  <span style={{ color: NUM_COLORS[cell.neighborCount] ?? '#000' }}>
                    {cell.neighborCount}
                  </span>
                )}
                {!cell.isOpen && cell.isFlagged && '🚩'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Game state type ──────────────────────────────────────────────────────────
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

interface BoardState {
  board: CellData[][];
  status: GameStatus;
  firstClick: boolean;
  flagsPlaced: number;
  cellsOpened: number;
}

function makeInitialState(): BoardState {
  return {
    board: createEmptyBoard(CONFIG.rows, CONFIG.cols),
    status: 'idle',
    firstClick: true,
    flagsPlaced: 0,
    cellsOpened: 0,
  };
}

// ── Main component ───────────────────────────────────────────────────────────
export default function BlitzAIPage() {
  const [seed] = useState(generateSeed);
  const [player, setPlayer] = useState<BoardState>(makeInitialState);
  const [ai, setAI] = useState<BoardState>(makeInitialState);
  const [elapsed, setElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiStateRef = useRef<BoardState>(makeInitialState());
  const startRef = useRef<number | null>(null);
  const gameOverRef = useRef(false);

  // Keep aiStateRef in sync so the interval closure always has fresh state
  useEffect(() => { aiStateRef.current = ai; }, [ai]);

  const stopTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (aiTimerRef.current) { clearInterval(aiTimerRef.current); aiTimerRef.current = null; }
  }, []);

  const endGame = useCallback((w: 'player' | 'ai') => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    stopTimers();
    setWinner(w);
    setGameOver(true);
  }, [stopTimers]);

  // Start timers when game starts
  const startTimers = useCallback(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - (startRef.current ?? Date.now()));
    }, 200);
  }, []);

  // AI tick — runs constraint solving then guesses
  const runAITick = useCallback(() => {
    const state = aiStateRef.current;
    if (state.status !== 'playing') return;

    const moves = getAIMoves(state.board);

    if (moves.length > 0) {
      // Execute first move
      const move = moves[0];
      setAI(prev => {
        if (prev.status !== 'playing') return prev;
        if (move.action === 'flag') {
          const newBoard = prev.board.map(r =>
            r.map(c => c.row === move.row && c.col === move.col ? { ...c, isFlagged: !c.isFlagged } : c)
          );
          return { ...prev, board: newBoard, flagsPlaced: newBoard.flat().filter(c => c.isFlagged).length };
        }
        // open
        const cell = prev.board[move.row][move.col];
        if (cell.isMine) {
          const revealed = revealAllMines(prev.board, move.row, move.col);
          return { ...prev, board: revealed, status: 'lost' };
        }
        const newBoard = openCell(prev.board, move.row, move.col);
        const opened = newBoard.flat().filter(c => c.isOpen && !c.isMine).length;
        const won = checkWin(newBoard);
        return { ...prev, board: newBoard, status: won ? 'won' : 'playing', cellsOpened: opened };
      });
    } else {
      // Guess
      const guess = getAIGuess(state.board);
      if (!guess) return;
      setAI(prev => {
        if (prev.status !== 'playing') return prev;
        const cell = prev.board[guess.row][guess.col];
        if (cell.isMine) {
          const revealed = revealAllMines(prev.board, guess.row, guess.col);
          return { ...prev, board: revealed, status: 'lost' };
        }
        const newBoard = openCell(prev.board, guess.row, guess.col);
        const opened = newBoard.flat().filter(c => c.isOpen && !c.isMine).length;
        const won = checkWin(newBoard);
        return { ...prev, board: newBoard, status: won ? 'won' : 'playing', cellsOpened: opened };
      });
    }
  }, []);

  // Watch AI status changes for game-over
  useEffect(() => {
    if (gameOver) return;
    if (ai.status === 'won') endGame('ai');
    if (ai.status === 'lost') endGame('player');
  }, [ai.status, gameOver, endGame]);

  // Watch player status changes for game-over
  useEffect(() => {
    if (gameOver) return;
    if (player.status === 'won') endGame('player');
    if (player.status === 'lost') endGame('ai');
  }, [player.status, gameOver, endGame]);

  // Player open cell
  const handlePlayerOpen = useCallback((row: number, col: number) => {
    setPlayer(prev => {
      if (prev.status === 'won' || prev.status === 'lost') return prev;
      let board = prev.board;
      let firstClick = prev.firstClick;

      if (firstClick) {
        board = placeMines(board, CONFIG.mines, row, col, seed);
        firstClick = false;
        // Also start timers + AI on first click
      }

      const cell = board[row][col];
      if (cell.isOpen || cell.isFlagged) return prev;

      if (cell.isMine) {
        const revealed = revealAllMines(board, row, col);
        return { ...prev, board: revealed, status: 'lost', firstClick };
      }

      const newBoard = openCell(board, row, col);
      const opened = newBoard.flat().filter(c => c.isOpen && !c.isMine).length;
      const won = checkWin(newBoard);
      return { ...prev, board: newBoard, status: won ? 'won' : 'playing', firstClick, cellsOpened: opened };
    });
  }, [seed]);

  // Detect first click to start AI and timers
  const prevFirstClick = useRef(true);
  useEffect(() => {
    if (prevFirstClick.current && !player.firstClick) {
      prevFirstClick.current = false;
      // Start AI board
      setAI(prev => {
        const board = placeMines(prev.board, CONFIG.mines, 3, 3, seed + 1);
        const opened = openCell(board, 3, 3);
        return { ...prev, board: opened, status: 'playing', firstClick: false, cellsOpened: opened.flat().filter(c => c.isOpen && !c.isMine).length };
      });
      startTimers();
      // AI ticks every 350ms with slight jitter
      aiTimerRef.current = setInterval(runAITick, 350);
    }
  }, [player.firstClick, seed, startTimers, runAITick]);

  // Player flag cell
  const handlePlayerFlag = useCallback((row: number, col: number) => {
    setPlayer(prev => {
      if (prev.status !== 'playing') return prev;
      const newBoard = prev.board.map(r =>
        r.map(c => c.row === row && c.col === col ? { ...c, isFlagged: !c.isFlagged } : c)
      );
      return { ...prev, board: newBoard, flagsPlaced: newBoard.flat().filter(c => c.isFlagged).length };
    });
  }, []);

  const resetGame = useCallback(() => {
    stopTimers();
    gameOverRef.current = false;
    prevFirstClick.current = true;
    setPlayer(makeInitialState());
    setAI(makeInitialState());
    setElapsed(0);
    setGameOver(false);
    setWinner(null);
  }, [stopTimers]);

  useEffect(() => () => stopTimers(), [stopTimers]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const totalSafe = CONFIG.rows * CONFIG.cols - CONFIG.mines;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'var(--gradient-brand)' }}>
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Блиц против ИИ</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                8×8 · 8 мин · Кто быстрее расчистит поле?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black font-mono" style={{ color: 'var(--accent)' }}>
              {formatTime(elapsed)}
            </div>
            <button onClick={resetGame} className="btn-secondary py-2 px-3 gap-2">
              <RotateCcw size={16} /> Новая игра
            </button>
          </div>
        </div>

        {/* Game over overlay */}
        {gameOver && (
          <div className={clsx(
            'game-card text-center py-8 mb-6',
            winner === 'player' ? 'border-green-500/50' : 'border-red-500/50'
          )}>
            <div className="text-5xl mb-3">{winner === 'player' ? '🏆' : '🤖'}</div>
            <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
              {winner === 'player' ? 'Вы победили!' : 'ИИ победил!'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {winner === 'player'
                ? `Время: ${formatTime(elapsed)} · Отличная игра!`
                : `Время: ${formatTime(elapsed)} · Попробуйте ещё раз!`}
            </p>
            <button onClick={resetGame} className="btn-primary mx-auto">
              <RotateCcw size={16} /> Играть снова
            </button>
          </div>
        )}

        {/* Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Player */}
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User size={18} style={{ color: 'var(--accent)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Вы</span>
                {player.status === 'won' && <span className="text-xs text-green-500 font-bold">ПОБЕДА</span>}
                {player.status === 'lost' && <span className="text-xs text-red-500 font-bold">ПРОИГРЫШ</span>}
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>🚩 {player.flagsPlaced}/{CONFIG.mines}</span>
                <span>✅ {player.cellsOpened}/{totalSafe}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(player.cellsOpened / totalSafe) * 100}%`, background: 'var(--gradient-brand)' }} />
            </div>
            <div className="flex justify-center">
              <MiniBoard
                board={player.board}
                onOpen={handlePlayerOpen}
                onFlag={handlePlayerFlag}
                disabled={player.status === 'won' || player.status === 'lost'}
              />
            </div>
            {player.status === 'idle' && (
              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Нажмите на клетку, чтобы начать
              </p>
            )}
          </div>

          {/* AI */}
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>ИИ</span>
                {ai.status === 'idle' && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ждёт вас…</span>}
                {ai.status === 'playing' && <span className="text-xs text-blue-400 font-bold animate-pulse">думает…</span>}
                {ai.status === 'won' && <span className="text-xs text-green-500 font-bold">ПОБЕДА</span>}
                {ai.status === 'lost' && <span className="text-xs text-red-500 font-bold">ОШИБКА</span>}
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>🚩 {ai.flagsPlaced}/{CONFIG.mines}</span>
                <span>✅ {ai.cellsOpened}/{totalSafe}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(ai.cellsOpened / totalSafe) * 100}%`, background: 'linear-gradient(90deg, #7A9E7A, #5B8B5B)' }} />
            </div>
            <div className="flex justify-center">
              <MiniBoard board={ai.board} disabled />
            </div>
            {ai.status === 'idle' && (
              <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                ИИ начнёт когда вы сделаете первый ход
              </p>
            )}
          </div>
        </div>

        {/* How to play */}
        {player.status === 'idle' && !gameOver && (
          <div className="mt-6 game-card p-4 grid grid-cols-3 gap-4 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div><span className="text-lg">🖱️</span><br />Левый клик — открыть</div>
            <div><span className="text-lg">🚩</span><br />Правый клик — флаг</div>
            <div><span className="text-lg">⚡</span><br />Расчисти поле быстрее ИИ</div>
          </div>
        )}
      </div>
    </div>
  );
}
