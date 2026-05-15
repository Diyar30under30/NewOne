import React, { useState } from 'react';
import { Brain, Eye, EyeOff, Lightbulb, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';
import { getAIHints } from '../lib/utils/probability';
import { clsx } from 'clsx';

export function AICoachPanel() {
  const { aiCoachEnabled, toggleAICoach, aiCoachMode, setAICoachMode, showProbabilities, toggleProbabilities } = useUIStore();
  const { board, status } = useGameStore();
  const [expanded, setExpanded] = useState(false);

  const hints = aiCoachEnabled && status === 'playing' ? getAIHints(board) : [];
  const bestHint = hints.find(h => h.isSafest);
  const definiteFlags = hints.filter(h => h.probability === 1);
  const safeCells = hints.filter(h => h.probability === 0);

  return (
    <div className="game-card">
      {/* Header - Toggle */}
      <button
        onClick={toggleAICoach}
        className={clsx(
          'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200',
          aiCoachEnabled
            ? 'bg-purple-500/20 border border-purple-500/40'
            : 'border border-transparent hover:border-gray-600'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            aiCoachEnabled ? 'bg-purple-500' : 'bg-gray-600'
          )}>
            <Brain size={18} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Коуч</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {aiCoachEnabled ? 'Включён' : 'Выключен'}
            </div>
          </div>
        </div>
        <div className={clsx(
          'w-12 h-6 rounded-full transition-all duration-200 relative',
          aiCoachEnabled ? 'bg-purple-500' : 'bg-gray-600'
        )}>
          <div className={clsx(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
            aiCoachEnabled ? 'left-7' : 'left-1'
          )} />
        </div>
      </button>

      {aiCoachEnabled && (
        <div className="mt-3 space-y-3">
          {/* Mode selector */}
          <div className="flex gap-1">
            {(['beginner', 'advanced', 'expert'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setAICoachMode(mode)}
                className={clsx(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  aiCoachMode === mode
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {mode === 'beginner' ? '🌱 Новичок' : mode === 'advanced' ? '⚡ Про' : '🎓 Эксперт'}
              </button>
            ))}
          </div>

          {/* Show probabilities toggle */}
          <button
            onClick={toggleProbabilities}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
              showProbabilities
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-gray-400 border border-gray-700 hover:border-gray-500'
            )}
          >
            {showProbabilities ? <Eye size={14} /> : <EyeOff size={14} />}
            Показывать % вероятности
          </button>

          {/* Hints */}
          {status === 'playing' && (
            <div className="space-y-2">
              {bestHint && (
                <div className="p-3 rounded-xl bg-green-500/15 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb size={14} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400">Лучший ход</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {bestHint.reasoning}
                  </p>
                </div>
              )}

              {(definiteFlags.length > 0 || safeCells.length > 0) && (
                <div className="grid grid-cols-2 gap-2">
                  {definiteFlags.length > 0 && (
                    <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-center">
                      <div className="text-lg font-bold text-red-400">{definiteFlags.length}</div>
                      <div className="text-xs text-red-300">Точных мин</div>
                    </div>
                  )}
                  {safeCells.length > 0 && (
                    <div className="p-2 rounded-xl bg-green-500/15 border border-green-500/30 text-center">
                      <div className="text-lg font-bold text-green-400">{safeCells.length}</div>
                      <div className="text-xs text-green-300">Безопасных</div>
                    </div>
                  )}
                </div>
              )}

              {hints.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-200 py-1"
                >
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expanded ? 'Скрыть' : `Все подсказки (${hints.length})`}
                </button>
              )}

              {expanded && (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {hints.slice(0, 10).map((hint, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'p-2 rounded-lg text-xs border',
                        hint.probability === 0 ? 'bg-green-500/10 border-green-500/30' :
                        hint.probability === 1 ? 'bg-red-500/10 border-red-500/30' :
                        'bg-yellow-500/10 border-yellow-500/30'
                      )}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ({hint.col + 1}, {hint.row + 1})
                        </span>
                        <span className={clsx(
                          'font-bold',
                          hint.probability < 0.3 ? 'text-green-400' :
                          hint.probability > 0.7 ? 'text-red-400' : 'text-yellow-400'
                        )}>
                          {Math.round(hint.probability * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === 'idle' && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
              Начните игру — AI коуч активируется автоматически
            </p>
          )}
        </div>
      )}
    </div>
  );
}
