import type { CellData, AIHint } from '../../types';
import { forEachNeighbor } from './gameEngine';

interface Constraint {
  cells: [number, number][];
  mineCount: number;
}

export function computeProbabilities(board: CellData[][]): Map<string, number> {
  const rows = board.length;
  const cols = board[0].length;
  const probMap = new Map<string, number>();

  const constraints: Constraint[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell.isOpen || cell.neighborCount === 0) continue;

      const closedNeighbors: [number, number][] = [];
      let flaggedCount = 0;

      forEachNeighbor(r, c, rows, cols, (nr, nc) => {
        const neighbor = board[nr][nc];
        if (neighbor.isFlagged) {
          flaggedCount++;
        } else if (!neighbor.isOpen) {
          closedNeighbors.push([nr, nc]);
        }
      });

      const remainingMines = cell.neighborCount - flaggedCount;
      if (closedNeighbors.length > 0 && remainingMines >= 0) {
        constraints.push({ cells: closedNeighbors, mineCount: remainingMines });
      }
    }
  }

  // Determine definite mines and definite safe cells
  const definiteMines = new Set<string>();
  const definiteSafe = new Set<string>();

  for (const constraint of constraints) {
    if (constraint.mineCount === constraint.cells.length) {
      constraint.cells.forEach(([r, c]) => definiteMines.add(`${r},${c}`));
    }
    if (constraint.mineCount === 0) {
      constraint.cells.forEach(([r, c]) => definiteSafe.add(`${r},${c}`));
    }
  }

  // Subset constraints
  for (let i = 0; i < constraints.length; i++) {
    for (let j = 0; j < constraints.length; j++) {
      if (i === j) continue;
      const a = constraints[i];
      const b = constraints[j];
      const aSet = new Set(a.cells.map(([r, c]) => `${r},${c}`));
      const bSet = new Set(b.cells.map(([r, c]) => `${r},${c}`));
      const isSubset = b.cells.every(([r, c]) => aSet.has(`${r},${c}`));
      if (isSubset && b.cells.length < a.cells.length) {
        const diffCells = a.cells.filter(([r, c]) => !bSet.has(`${r},${c}`));
        const diffMines = a.mineCount - b.mineCount;
        if (diffMines === diffCells.length) {
          diffCells.forEach(([r, c]) => definiteMines.add(`${r},${c}`));
        }
        if (diffMines === 0) {
          diffCells.forEach(([r, c]) => definiteSafe.add(`${r},${c}`));
        }
      }
    }
  }

  // Assign definite probabilities
  for (const key of definiteMines) probMap.set(key, 1.0);
  for (const key of definiteSafe) probMap.set(key, 0.0);

  // For remaining unknown cells, use local estimate
  const allClosed: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isOpen && !board[r][c].isFlagged) {
        allClosed.push([r, c]);
      }
    }
  }

  // Count remaining mines
  let totalMines = 0;
  let totalFlags = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine && !board[r][c].isOpen) totalMines++;
      if (board[r][c].isFlagged) totalFlags++;
    }
  }
  const remainingMines = totalMines - totalFlags;

  const unknownCells = allClosed.filter(([r, c]) => {
    const key = `${r},${c}`;
    return !definiteMines.has(key) && !definiteSafe.has(key);
  });

  // For cells with constraint info, use constraint-based probability
  for (const [r, c] of unknownCells) {
    const key = `${r},${c}`;
    if (probMap.has(key)) continue;

    let weightedProb = 0;
    let constraintCount = 0;

    for (const constraint of constraints) {
      const inConstraint = constraint.cells.some(([cr, cc]) => cr === r && cc === c);
      if (inConstraint) {
        const prob = constraint.cells.length > 0 ? constraint.mineCount / constraint.cells.length : 0;
        weightedProb += prob;
        constraintCount++;
      }
    }

    if (constraintCount > 0) {
      probMap.set(key, Math.min(1, Math.max(0, weightedProb / constraintCount)));
    } else {
      // Global estimate for unreachable cells
      const globalProb = unknownCells.length > 0 ? remainingMines / unknownCells.length : 0;
      probMap.set(key, Math.min(1, Math.max(0, globalProb)));
    }
  }

  return probMap;
}

export function getAIHints(board: CellData[][]): AIHint[] {
  const probMap = computeProbabilities(board);
  const hints: AIHint[] = [];

  for (const [key, prob] of probMap.entries()) {
    const [r, c] = key.split(',').map(Number);
    const cell = board[r][c];
    if (cell.isOpen || cell.isFlagged) continue;

    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (prob === 0 || prob === 1) confidence = 'high';
    else if (prob < 0.2 || prob > 0.8) confidence = 'medium';

    hints.push({
      row: r,
      col: c,
      probability: prob,
      confidence,
      reasoning: generateReasoning(board, r, c, prob),
      isSafest: false,
      isMostDangerous: false,
    });
  }

  if (hints.length > 0) {
    const sorted = [...hints].sort((a, b) => a.probability - b.probability);
    sorted[0].isSafest = true;
    sorted[sorted.length - 1].isMostDangerous = true;
  }

  return hints;
}

function generateReasoning(board: CellData[][], row: number, col: number, prob: number): string {
  const rows = board.length;
  const cols = board[0].length;

  const openNeighbors: CellData[] = [];
  forEachNeighbor(row, col, rows, cols, (nr, nc) => {
    if (board[nr][nc].isOpen && board[nr][nc].neighborCount > 0) {
      openNeighbors.push(board[nr][nc]);
    }
  });

  if (prob === 0) {
    return `Клетка (${col + 1}, ${row + 1}) — БЕЗОПАСНА! Все мины вокруг помечены флагами.`;
  }
  if (prob === 1) {
    return `Клетка (${col + 1}, ${row + 1}) — ТОЧНО МИНА! Немедленно поставьте флаг.`;
  }
  if (prob < 0.15) {
    return `Клетка (${col + 1}, ${row + 1}) — очень безопасная (риск ${Math.round(prob * 100)}%). Рекомендую открыть.`;
  }
  if (prob > 0.85) {
    return `Клетка (${col + 1}, ${row + 1}) — очень опасная (риск мины ${Math.round(prob * 100)}%). Поставьте флаг!`;
  }
  if (openNeighbors.length > 0) {
    const maxNum = Math.max(...openNeighbors.map(c => c.neighborCount));
    return `Клетка (${col + 1}, ${row + 1}) — риск мины ${Math.round(prob * 100)}% (влияет цифра ${maxNum} рядом).`;
  }
  return `Клетка (${col + 1}, ${row + 1}) — риск мины ${Math.round(prob * 100)}%. Рассчитано по глобальной статистике.`;
}

export function getBestMove(board: CellData[][]): AIHint | null {
  const hints = getAIHints(board);
  if (hints.length === 0) return null;
  return hints.reduce((best, hint) => hint.probability < best.probability ? hint : best, hints[0]);
}

export function analyzeGame(board: CellData[][], moveHistory: Array<{row: number; col: number; prob: number}>): {
  bestMoves: Array<{row: number; col: number; prob: number; label: string}>;
  worstMoves: Array<{row: number; col: number; prob: number; label: string}>;
} {
  const sorted = [...moveHistory].sort((a, b) => a.prob - b.prob);
  const bestMoves = sorted.slice(0, 3).map((m, i) => ({
    ...m,
    label: `Ход #${i + 1}: Клетка (${m.col + 1}, ${m.row + 1}) — риск ${Math.round(m.prob * 100)}%`,
  }));
  const worstMoves = sorted.slice(-3).reverse().map((m, i) => ({
    ...m,
    label: `Ход #${i + 1}: Клетка (${m.col + 1}, ${m.row + 1}) — риск ${Math.round(m.prob * 100)}%`,
  }));
  return { bestMoves, worstMoves };
}
