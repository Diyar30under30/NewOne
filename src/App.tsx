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
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 1px 40px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity group"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
          💣
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-black text-white tracking-tight leading-none">Minesweeper</div>
          <div className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--accent)' }}>PRO</div>
        </div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        {profile && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
            <span>🪙</span>
            <span>{profile.coins.toLocaleString()}</span>
          </div>
        )}

        <button
          onClick={toggleSound}
          className="p-2 rounded-xl transition-all text-white/60 hover:text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
          title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <ThemeSwitcher compact />

        {!loading && (
          user ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-black text-white shrink-0">
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-semibold text-white hidden sm:block max-w-[72px] truncate">
                {profile?.username ?? 'Профиль'}
              </span>
              {profile?.is_pro && <span className="text-xs">⭐</span>}
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              <LogIn size={14} />
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
    { to: '/', icon: <Gamepad2 size={22} />, label: 'Игра' },
    { to: '/daily', icon: <Calendar size={22} />, label: 'Daily' },
    { to: '/multiplayer', icon: <Users size={22} />, label: 'Онлайн' },
    { to: '/store', icon: <ShoppingBag size={22} />, label: 'Магазин' },
    { to: '/profile', icon: <User size={22} />, label: 'Профиль' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 pt-2 pb-3"
      style={{
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--glass-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -1px 40px rgba(0,0,0,0.2)',
      }}
    >
      {links.map(({ to, icon, label }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 relative"
          >
            {isActive && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                style={{ background: 'var(--gradient-brand)' }} />
            )}
            <div className={clsx(
              'transition-all duration-200 p-1.5 rounded-xl',
              isActive
                ? 'text-white scale-110'
                : 'text-gray-500 hover:text-gray-300'
            )}
              style={isActive ? { background: 'var(--gradient-brand)', boxShadow: '0 4px 12px var(--accent-glow)' } : {}}
            >
              {icon}
            </div>
            <span className={clsx('text-[10px] font-semibold transition-colors', isActive ? 'text-white' : 'text-gray-500')}>
              {label}
            </span>
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
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
  const { user } = useAuth();

  useEffect(() => {
    // If Supabase already auto-signed in via the confirm link, go to home
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user]);

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

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Supabase detects session from URL automatically (detectSessionInUrl: true).
    // Wait for the auth state to settle then redirect.
    if (!loading) {
      navigate(user ? '/' : '/auth', { replace: true });
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>Авторизация…</p>
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
