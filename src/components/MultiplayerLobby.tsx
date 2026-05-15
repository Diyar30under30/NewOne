import React, { useState, useEffect } from 'react';
import { Users, Plus, Lock, Globe, Swords, Trophy, Gamepad2, RefreshCw } from 'lucide-react';
import { useMultiplayer } from '../hooks/useMultiplayer';
import type { MultiplayerRoom, Difficulty } from '../types';
import { clsx } from 'clsx';
import { Modal } from './common/Modal';
import { GAME_CONFIGS } from '../lib/utils/constants';

interface MultiplayerLobbyProps {
  userId: string;
  username: string;
  onJoinRoom: (room: MultiplayerRoom) => void;
}

const MODE_INFO = {
  duel: { icon: <Swords size={16} />, label: 'Дуэль 1v1', color: 'text-red-400', max: 2 },
  coop: { icon: <Gamepad2 size={16} />, label: 'Кооп 2-4', color: 'text-green-400', max: 4 },
  battle: { icon: <Trophy size={16} />, label: 'Битва 4-8', color: 'text-yellow-400', max: 8 },
  league: { icon: <Trophy size={16} />, label: 'Лига 8', color: 'text-purple-400', max: 8 },
};

export function MultiplayerLobby({ userId, username, onJoinRoom }: MultiplayerLobbyProps) {
  const { rooms, loading, error, fetchRooms, createRoom, joinRoom, setError } = useMultiplayer(userId);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinPassword, setShowJoinPassword] = useState<MultiplayerRoom | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const [createForm, setCreateForm] = useState({
    mode: 'duel' as MultiplayerRoom['mode'],
    difficulty: 'medium' as Difficulty,
    isPrivate: false,
    password: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreate = async () => {
    const maxPlayers = MODE_INFO[createForm.mode].max;
    const room = await createRoom(
      createForm.mode,
      createForm.difficulty,
      createForm.isPrivate,
      createForm.isPrivate ? createForm.password : undefined,
      maxPlayers
    );
    if (room) {
      setShowCreate(false);
      onJoinRoom(room);
    }
  };

  const handleJoin = async (room: MultiplayerRoom) => {
    if (room.is_private) {
      setShowJoinPassword(room);
      return;
    }
    const ok = await joinRoom(room.id);
    if (ok) onJoinRoom(room);
  };

  const handleJoinWithPassword = async () => {
    if (!showJoinPassword) return;
    const ok = await joinRoom(showJoinPassword.id, passwordInput);
    if (ok) {
      onJoinRoom(showJoinPassword);
      setShowJoinPassword(null);
      setPasswordInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users size={22} className="text-blue-400" />
          Мультиплеер
        </h2>
        <div className="flex gap-2">
          <button onClick={fetchRooms} className="btn-secondary p-2 rounded-xl" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus size={16} /> Создать
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">ок</button>
        </div>
      )}

      {/* Room list */}
      <div className="space-y-2">
        {loading && (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <div className="spinner mx-auto mb-2" />
            Загрузка комнат...
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Нет открытых комнат</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Создайте первую и пригласите друзей!</p>
          </div>
        )}

        {rooms.map(room => {
          const modeInfo = MODE_INFO[room.mode];
          const config = GAME_CONFIGS[room.difficulty];
          const isFull = room.players.length >= room.max_players;
          return (
            <div
              key={room.id}
              className="flex items-center justify-between p-4 rounded-2xl border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <span className={modeInfo.color}>{modeInfo.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {modeInfo.label}
                    </span>
                    {room.is_private ? (
                      <Lock size={12} className="text-yellow-400" />
                    ) : (
                      <Globe size={12} className="text-green-400" />
                    )}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {config.label} • {room.players.length}/{room.max_players} игроков
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleJoin(room)}
                disabled={isFull}
                className={clsx(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                  isFull
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                )}
              >
                {isFull ? 'Полная' : 'Войти'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Room Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Создать комнату" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Режим</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(MODE_INFO) as [MultiplayerRoom['mode'], typeof MODE_INFO.duel][]).map(([mode, info]) => (
                <button
                  key={mode}
                  onClick={() => setCreateForm(f => ({ ...f, mode }))}
                  className={clsx(
                    'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                    createForm.mode === mode
                      ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  )}
                >
                  {info.icon} {info.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Сложность</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setCreateForm(f => ({ ...f, difficulty: d }))}
                  className={clsx(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                    createForm.difficulty === d
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-700 text-gray-400'
                  )}
                >
                  {GAME_CONFIGS[d].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Закрытая комната
            </span>
            <button
              onClick={() => setCreateForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
              className={clsx(
                'w-12 h-6 rounded-full transition-all relative',
                createForm.isPrivate ? 'bg-blue-500' : 'bg-gray-600'
              )}
            >
              <div className={clsx(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                createForm.isPrivate ? 'left-7' : 'left-1'
              )} />
            </button>
          </div>

          {createForm.isPrivate && (
            <input
              type="text"
              className="input-field"
              placeholder="Пароль для комнаты"
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
            />
          )}

          <button onClick={handleCreate} className="btn-primary w-full">
            <Plus size={16} /> Создать комнату
          </button>
        </div>
      </Modal>

      {/* Password modal */}
      <Modal open={!!showJoinPassword} onClose={() => setShowJoinPassword(null)} title="Введите пароль" size="sm">
        <div className="space-y-4">
          <input
            type="password"
            className="input-field"
            placeholder="Пароль комнаты"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoinWithPassword()}
          />
          <button onClick={handleJoinWithPassword} className="btn-primary w-full">
            Войти
          </button>
        </div>
      </Modal>
    </div>
  );
}
