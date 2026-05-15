import React, { useState } from 'react';
import { MultiplayerLobby } from '../components/MultiplayerLobby';
import { MultiplayerGame } from '../components/MultiplayerGame';
import { useAuth } from '../hooks/useAuth';
import { useGuestStore } from '../store/guestStore';
import { useNavigate } from 'react-router-dom';
import type { MultiplayerRoom } from '../types';
import { Swords, Bot, Zap } from 'lucide-react';

export function MultiplayerPage() {
  const { user, profile } = useAuth();
  const { isGuest } = useGuestStore();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);

  // Guest or not logged in: show limited menu with Blitz AI
  if (!user || !profile) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              🎮
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Мультиплеер</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isGuest ? 'Гостевой режим' : 'Не авторизован'}
              </p>
            </div>
          </div>

          {/* Blitz AI — available to all */}
          <button
            onClick={() => navigate('/multiplayer/blitz-ai')}
            className="game-card w-full text-left p-5 hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'linear-gradient(135deg, #7A9E7A, #5B8B5B)' }}>
                🤖
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Блиц против ИИ</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">Доступно</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  8×8 · Соревнуйтесь с ИИ в скорости расчистки поля. Для всех!
                </p>
              </div>
              <Zap size={20} style={{ color: 'var(--accent)' }} />
            </div>
          </button>

          {/* Human multiplayer — requires account */}
          <div className="game-card p-5 opacity-60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: 'var(--bg-secondary)' }}>
                ⚔️
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Игра с людьми</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-semibold">Нужен аккаунт</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Дуэль, кооп, турниры — требуют авторизации
                </p>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/auth')} className="btn-primary w-full py-3">
            Войти для полного доступа
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Blitz AI card always at top */}
        {!activeRoom && (
          <button
            onClick={() => navigate('/multiplayer/blitz-ai')}
            className="game-card w-full text-left p-4 mb-4 hover:scale-[1.01] transition-transform cursor-pointer flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #7A9E7A, #5B8B5B)' }}>
              🤖
            </div>
            <div className="flex-1">
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Блиц против ИИ</span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Мгновенная игра · Тет-а-тет с ИИ</p>
            </div>
            <Zap size={18} style={{ color: 'var(--accent)' }} />
          </button>
        )}

        {activeRoom ? (
          <MultiplayerGame
            room={activeRoom}
            userId={user.id}
            username={profile.username}
            onLeave={() => setActiveRoom(null)}
          />
        ) : (
          <MultiplayerLobby
            userId={user.id}
            username={profile.username}
            onJoinRoom={setActiveRoom}
          />
        )}
      </div>
    </div>
  );
}
