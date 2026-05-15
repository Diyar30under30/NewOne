import React, { useState } from 'react';
import { MultiplayerLobby } from '../components/MultiplayerLobby';
import { MultiplayerGame } from '../components/MultiplayerGame';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { MultiplayerRoom } from '../types';
import { Swords } from 'lucide-react';

export function MultiplayerPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Мультиплеер
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Для игры с другими людьми необходимо войти в аккаунт
          </p>
          <button onClick={() => navigate('/auth')} className="btn-primary w-full">
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
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
