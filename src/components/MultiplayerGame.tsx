import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Board } from './Board';
import { Timer } from './Timer';
import { useGameStore } from '../store/gameStore';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useSound } from '../hooks/useSound';
import type { MultiplayerRoom, RealtimeMove, ChatMessage } from '../types';
import { Users, MessageCircle, Send, Trophy, LogOut } from 'lucide-react';
import { countOpenCells } from '../lib/utils/gameEngine';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface MultiplayerGameProps {
  room: MultiplayerRoom;
  userId: string;
  username: string;
  onLeave: () => void;
}

interface OpponentStatus {
  id: string;
  username: string;
  cellsOpened: number;
  status: 'playing' | 'won' | 'lost';
}

export function MultiplayerGame({ room, userId, username, onLeave }: MultiplayerGameProps) {
  const { initGame, status, board } = useGameStore();
  const { broadcastMove, subscribeToRoom, leaveRoom, chatMessages, sendChatMessage } = useMultiplayer(userId);
  const { play } = useSound();
  const [opponents, setOpponents] = useState<OpponentStatus[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGame(room.difficulty, room.seed);
  }, [room]);

  useEffect(() => {
    const channel = subscribeToRoom(room.id, handleRemoteMove);
    return () => { channel.unsubscribe(); };
  }, [room.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleRemoteMove = useCallback((move: RealtimeMove) => {
    if (move.player_id === userId) return;
    if (move.type === 'win') {
      toast(`🏆 ${move.player_id} победил!`, { icon: '🎮' });
      setOpponents(prev => prev.map(o =>
        o.id === move.player_id ? { ...o, status: 'won' } : o
      ));
    } else if (move.type === 'lose') {
      setOpponents(prev => prev.map(o =>
        o.id === move.player_id ? { ...o, status: 'lost' } : o
      ));
    } else if (move.cells_opened !== undefined) {
      setOpponents(prev => prev.map(o =>
        o.id === move.player_id ? { ...o, cellsOpened: move.cells_opened! } : o
      ));
    }
  }, [userId]);

  const handleCellOpen = useCallback(async (hitMine: boolean, won: boolean) => {
    const opened = countOpenCells(board);
    await broadcastMove(room.id, {
      type: won ? 'win' : hitMine ? 'lose' : 'open',
      player_id: userId,
      cells_opened: opened,
    });

    if (hitMine) {
      play('explode');
      setGameResult('lost');
    } else if (won) {
      play('win');
      setGameResult('won');
    } else {
      play('reveal');
    }
  }, [board, room.id, userId, broadcastMove, play]);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendChatMessage(room.id, chatInput.trim(), username);
    setChatInput('');
  };

  const handleLeave = async () => {
    await leaveRoom();
    onLeave();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Онлайн игра</span>
          </div>
          <Timer compact />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className="btn-secondary p-2 rounded-xl relative"
          >
            <MessageCircle size={16} />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">
                {Math.min(chatMessages.length, 9)}
              </span>
            )}
          </button>
          <button onClick={handleLeave} className="btn-danger py-2 px-3 text-sm rounded-xl">
            <LogOut size={14} /> Выйти
          </button>
        </div>
      </div>

      {/* Game result overlay */}
      {gameResult && (
        <div className={clsx(
          'p-4 rounded-2xl text-center border',
          gameResult === 'won'
            ? 'bg-green-500/20 border-green-500/40'
            : 'bg-red-500/20 border-red-500/40'
        )}>
          <div className="text-4xl mb-2">{gameResult === 'won' ? '🏆' : '💥'}</div>
          <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {gameResult === 'won' ? 'Победа!' : 'Поражение!'}
          </div>
          <button onClick={handleLeave} className="mt-3 btn-primary text-sm">
            В лобби
          </button>
        </div>
      )}

      {/* Opponents */}
      {opponents.length > 0 && (
        <div className="game-card">
          <div className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Users size={12} /> Соперники
          </div>
          {opponents.map(opp => (
            <div key={opp.id} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                {opp.username[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{opp.username}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {opp.cellsOpened} клеток открыто
                </div>
              </div>
              <span className={clsx(
                'text-xs font-bold',
                opp.status === 'won' ? 'text-green-400' :
                opp.status === 'lost' ? 'text-red-400' : 'text-blue-400'
              )}>
                {opp.status === 'won' ? '🏆 Победа' : opp.status === 'lost' ? '💥 Поражение' : '🎮 Играет'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Game board */}
      <Board onCellOpen={handleCellOpen} isMultiplayer />

      {/* Chat */}
      {showChat && (
        <div className="game-card">
          <div className="text-xs font-semibold mb-3 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <MessageCircle size={12} /> Чат
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5 mb-3 pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-xs">
                <span className="font-bold text-blue-400">{msg.username}: </span>
                <span style={{ color: 'var(--text-secondary)' }}>{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              className="input-field flex-1 py-2 text-xs"
              placeholder="Сообщение..."
              maxLength={100}
            />
            <button onClick={handleSendChat} className="btn-primary px-3 py-2 rounded-xl">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
