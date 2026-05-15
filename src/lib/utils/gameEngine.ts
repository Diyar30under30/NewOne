import type { CellData, Difficulty, GameConfig } from '../../types';
import { GAME_CONFIGS } from './constants';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function createEmptyBoard(rows: number, cols: number): CellData[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isOpen: false,
      isFlagged: false,
      isQuestion: false,
      neighborCount: 0,
    }))
  );
}

export function placeMines(
  board: CellData[][],
  mines: number,
  safeRow: number,
  safeCol: number,
  seed?: number
): CellData[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;

  const safeZone = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeRow + dr;
      const nc = safeCol + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        safeZone.add(`${nr},${nc}`);
      }
    }
  }

  const available: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeZone.has(`${r},${c}`)) available.push([r, c]);
    }
  }

  let placed = 0;
  while (placed < mines && available.length > 0) {
    const idx = Math.floor((seed !== undefined ? rand() : Math.random()) * available.length);
    const [r, c] = available[idx];
    available.splice(idx, 1);
    newBoard[r][c].isMine = true;
    placed++;
  }

  return computeNeighborCounts(newBoard);
}

export function computeNeighborCounts(board: CellData[][]): CellData[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(r => r.map(c => ({ ...c })));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        forEachNeighbor(r, c, rows, cols, (nr, nc) => {
          if (newBoard[nr][nc].isMine) count++;
        });
        newBoard[r][c].neighborCount = count;
      }
    }
  }
  return newBoard;
}

export function forEachNeighbor(
  row: number,
  col: number,
  rows: number,
  cols: number,
  callback: (r: number, c: number) => void
): void {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        callback(nr, nc);
      }
    }
  }
}

export function openCell(board: CellData[][], row: number, col: number): CellData[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(r => r.map(c => ({ ...c })));

  if (newBoard[row][col].isOpen || newBoard[row][col].isFlagged) return board;

  const stack: [number, number][] = [[row, col]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = newBoard[r][c];
    if (cell.isFlagged || cell.isOpen) continue;

    cell.isOpen = true;

    if (cell.neighborCount === 0 && !cell.isMine) {
      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        const neighbor = newBoard[nr][nc];
        if (!neighbor.isOpen && !neighbor.isFlagged && !neighbor.isMine) {
          stack.push([nr, nc]);
        } else if (!neighbor.isOpen && !neighbor.isFlagged && neighbor.neighborCount >= 0) {
          stack.push([nr, nc]);
        }
      });
    }
  }

  return newBoard;
}

export function revealAllMines(board: CellData[][], explodedRow: number, explodedCol: number): CellData[][] {
  return board.map(row =>
    row.map(cell => {
      if (cell.isMine) {
        return { ...cell, isOpen: true, isExploded: cell.row === explodedRow && cell.col === explodedCol };
      }
      if (cell.isFlagged && !cell.isMine) {
        return { ...cell, isOpen: true };
      }
      return cell;
    })
  );
}

export function checkWin(board: CellData[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isOpen) return false;
    }
  }
  return true;
}

export function countOpenCells(board: CellData[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isOpen && !cell.isMine) count++;
    }
  }
  return count;
}

export function getConfigForDifficulty(difficulty: Difficulty): GameConfig {
  return GAME_CONFIGS[difficulty];
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function getDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function chordClick(board: CellData[][], row: number, col: number): CellData[][] {
  const cell = board[row][col];
  if (!cell.isOpen || cell.neighborCount === 0) return board;

  const rows = board.length;
  const cols = board[0].length;
  let flagCount = 0;

  forEachNeighbor(row, col, rows, cols, (nr, nc) => {
    if (board[nr][nc].isFlagged) flagCount++;
  });

  if (flagCount !== cell.neighborCount) return board;

  let newBoard = board.map(r => r.map(c => ({ ...c })));
  let hitMine = false;
  let mineRow = -1, mineCol = -1;

  forEachNeighbor(row, col, rows, cols, (nr, nc) => {
    if (!newBoard[nr][nc].isFlagged && !newBoard[nr][nc].isOpen) {
      if (newBoard[nr][nc].isMine) {
        hitMine = true;
        mineRow = nr;
        mineCol = nc;
      } else {
        newBoard = openCell(newBoard, nr, nc);
      }
    }
  });

  if (hitMine) {
    return revealAllMines(newBoard, mineRow, mineCol);
  }

  return newBoard;
}
