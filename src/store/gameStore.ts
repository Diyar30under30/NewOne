import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CellData, Difficulty, GameStatus } from '../types';
import {
  createEmptyBoard,
  placeMines,
  openCell,
  revealAllMines,
  checkWin,
  generateSeed,
  chordClick,
} from '../lib/utils/gameEngine';
import { GAME_CONFIGS } from '../lib/utils/constants';

interface MoveRecord {
  row: number;
  col: number;
  prob: number;
}

interface GameStore {
  board: CellData[][];
  status: GameStatus;
  difficulty: Difficulty;
  startTime: number | null;
  endTime: number | null;
  flagsPlaced: number;
  minesTotal: number;
  firstClick: boolean;
  seed: number;
  elapsedMs: number;
  moveHistory: MoveRecord[];
  cellProbabilities: Map<string, number>;

  initGame: (difficulty: Difficulty, seed?: number) => void;
  handleCellClick: (row: number, col: number) => { hitMine: boolean; won: boolean };
  handleCellFlag: (row: number, col: number) => void;
  handleChordClick: (row: number, col: number) => { hitMine: boolean; won: boolean };
  updateElapsed: (ms: number) => void;
  setCellProbabilities: (probs: Map<string, number>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    board: [],
    status: 'idle',
    difficulty: 'easy',
    startTime: null,
    endTime: null,
    flagsPlaced: 0,
    minesTotal: 0,
    firstClick: true,
    seed: generateSeed(),
    elapsedMs: 0,
    moveHistory: [],
    cellProbabilities: new Map(),

    initGame: (difficulty, seed) => {
      const config = GAME_CONFIGS[difficulty];
      const newSeed = seed ?? generateSeed();
      const emptyBoard = createEmptyBoard(config.rows, config.cols);
      set({
        board: emptyBoard,
        status: 'idle',
        difficulty,
        startTime: null,
        endTime: null,
        flagsPlaced: 0,
        minesTotal: config.mines,
        firstClick: true,
        seed: newSeed,
        elapsedMs: 0,
        moveHistory: [],
        cellProbabilities: new Map(),
      });
    },

    handleCellClick: (row, col) => {
      const { board, status, firstClick, seed, cellProbabilities } = get();
      if (status === 'won' || status === 'lost') return { hitMine: false, won: false };

      const cell = board[row][col];
      if (cell.isOpen || cell.isFlagged) return { hitMine: false, won: false };

      let currentBoard = board;
      let isFirst = firstClick;

      if (isFirst) {
        currentBoard = placeMines(currentBoard, get().minesTotal, row, col, seed);
        isFirst = false;
      }

      const clickedCell = currentBoard[row][col];
      const prob = cellProbabilities.get(`${row},${col}`) ?? 0;

      if (clickedCell.isMine) {
        const revealedBoard = revealAllMines(currentBoard, row, col);
        set({
          board: revealedBoard,
          status: 'lost',
          endTime: Date.now(),
          firstClick: isFirst,
          moveHistory: [...get().moveHistory, { row, col, prob }],
        });
        return { hitMine: true, won: false };
      }

      const newBoard = openCell(currentBoard, row, col);
      const won = checkWin(newBoard);

      set({
        board: newBoard,
        status: won ? 'won' : 'playing',
        startTime: get().startTime ?? Date.now(),
        endTime: won ? Date.now() : null,
        firstClick: isFirst,
        moveHistory: [...get().moveHistory, { row, col, prob }],
      });

      return { hitMine: false, won };
    },

    handleCellFlag: (row, col) => {
      const { board, status } = get();
      if (status === 'won' || status === 'lost') return;
      const cell = board[row][col];
      if (cell.isOpen) return;

      const newBoard = board.map(r =>
        r.map(c => {
          if (c.row === row && c.col === col) {
            if (!c.isFlagged && !c.isQuestion) {
              return { ...c, isFlagged: true };
            } else if (c.isFlagged) {
              return { ...c, isFlagged: false, isQuestion: true };
            } else {
              return { ...c, isQuestion: false };
            }
          }
          return c;
        })
      );

      const flagCount = newBoard.flat().filter(c => c.isFlagged).length;
      set({ board: newBoard, flagsPlaced: flagCount });
    },

    handleChordClick: (row, col) => {
      const { board, status } = get();
      if (status === 'won' || status === 'lost') return { hitMine: false, won: false };

      const newBoard = chordClick(board, row, col);
      const won = checkWin(newBoard);
      const hitMine = newBoard.flat().some(c => c.isMine && c.isOpen && !board[c.row][c.col].isOpen);

      set({
        board: newBoard,
        status: hitMine ? 'lost' : won ? 'won' : 'playing',
        endTime: hitMine || won ? Date.now() : null,
      });

      return { hitMine, won };
    },

    updateElapsed: (ms) => set({ elapsedMs: ms }),

    setCellProbabilities: (probs) => set({ cellProbabilities: probs }),

    resetGame: () => {
      const { difficulty } = get();
      get().initGame(difficulty);
    },
  }))
);
