import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamePage } from './pages/GamePage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { MultiplayerPage } from './pages/MultiplayerPage';
import { StorePage } from './pages/StorePage';
import { DailyPage } from './pages/DailyPage';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useUIStore } from './store/uiStore';
import {
  Gamepad2, Users, ShoppingBag, Calendar, User, LogIn, Coins, Volume2, VolumeX
} from 'lucide-react';
import { clsx } from 'clsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Header() {
  const { user, profile, loading } = useAuth();
  const { soundEnabled, toggleSound } = useUIStore();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 font-black text-white hover:opacity-80 transition-opacity"
      >
        <span className="text-2xl">💣</span>
        <span className="hidden sm:block text-base tracking-tight">Minesweeper Pro</span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Coin counter */}
        {profile && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-sm">
            <span className="text-yellow-300">🪙</span>
            <span>{profile.coins}</span>
          </div>
        )}

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
          title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Theme */}
        <ThemeSwitcher compact />

        {/* Auth */}
        {!loading && (
          user ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-semibold hidden sm:block max-w-[80px] truncate">
                {profile?.username ?? 'Профиль'}
              </span>
              {profile?.is_pro && <span className="text-yellow-300 text-xs">⭐</span>}
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25 transition-all"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Войти</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();

  const links = [
    { to: '/', icon: <Gamepad2 size={20} />, label: 'Игра' },
    { to: '/daily', icon: <Calendar size={20} />, label: 'Daily' },
    { to: '/multiplayer', icon: <Users size={20} />, label: 'Онлайн' },
    { to: '/store', icon: <ShoppingBag size={20} />, label: 'Магазин' },
    { to: '/profile', icon: <User size={20} />, label: 'Профиль' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
      style={{
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {links.map(({ to, icon, label }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200',
              isActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <div className={clsx(
              'transition-all duration-200',
              isActive ? 'scale-110' : ''
            )}>
              {icon}
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function AppContent() {
  useTheme();

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/confirm" element={<EmailConfirmPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/multiplayer" element={<MultiplayerPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/daily" element={<DailyPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

function EmailConfirmPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full game-card text-center p-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Email подтверждён!</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Ваш аккаунт активирован. Теперь вы можете войти.
        </p>
        <button onClick={() => navigate('/auth')} className="btn-primary w-full">
          Войти
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
        <AppContent />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            duration: 3000,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
