import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamePage } from './pages/GamePage';
import BlitzAIPage from './pages/BlitzAIPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { MultiplayerPage } from './pages/MultiplayerPage';
import { StorePage } from './pages/StorePage';
import { DailyPage } from './pages/DailyPage';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useUIStore } from './store/uiStore';
import { useGuestStore } from './store/guestStore';
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
  const { isGuest, guestName, coins: guestCoins, clearGuest } = useGuestStore();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between"
      style={{
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 1px 24px var(--shadow-color)',
      }}
    >
      {/* Logo — serif */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0"
          style={{ background: 'var(--gradient-brand)', boxShadow: '0 4px 12px var(--accent-glow)' }}>
          💣
        </div>
        <div className="hidden sm:block">
          <span className="lucky-heading text-xl leading-none" style={{ color: 'var(--text-primary)' }}>
            Minesweeper
          </span>
          <span className="ml-2 text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: "'Luckiest Guy', sans-serif" }}>
            Pro
          </span>
        </div>
      </button>

      {/* Right */}
      <div className="flex items-center gap-2">
        {(profile || isGuest) && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-base"
            style={{ background: 'rgba(196,119,90,0.1)', border: '1px solid rgba(196,119,90,0.2)', color: 'var(--accent)' }}>
            🪙 <span>{(profile?.coins ?? guestCoins).toLocaleString()}</span>
          </div>
        )}

        <button
          onClick={toggleSound}
          className="p-2 rounded-2xl transition-all"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <ThemeSwitcher compact />

        {!loading && (
          user ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-2xl transition-all"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: 'var(--gradient-brand)' }}>
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[80px] truncate" style={{ color: 'var(--text-secondary)' }}>
                {profile?.username ?? 'Профиль'}
              </span>
              {profile?.is_pro && <span className="text-xs">⭐</span>}
            </button>
          ) : isGuest ? (
            <button
              onClick={() => { clearGuest(); navigate('/auth'); }}
              className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-2xl transition-all"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              title="Выйти из гостевого режима"
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                👤
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[80px] truncate" style={{ color: 'var(--text-secondary)' }}>
                {guestName || 'Гость'}
              </span>
            </button>
          ) : (
            <button onClick={() => navigate('/auth')} className="btn-primary py-2 px-4 text-sm">
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
    { to: '/', icon: <Gamepad2 size={20} />, label: 'Игра' },
    { to: '/daily', icon: <Calendar size={20} />, label: 'Daily' },
    { to: '/multiplayer', icon: <Users size={20} />, label: 'Онлайн' },
    { to: '/store', icon: <ShoppingBag size={20} />, label: 'Магазин' },
    { to: '/profile', icon: <User size={20} />, label: 'Профиль' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 pt-2 pb-safe-3"
      style={{
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--border-color)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 24px var(--shadow-color)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {links.map(({ to, icon, label }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all duration-200 relative"
          >
            <div
              className={clsx('flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200',
                isActive ? 'scale-105' : '')}
              style={isActive
                ? { background: 'var(--gradient-brand)', boxShadow: '0 4px 12px var(--accent-glow)', color: 'white' }
                : { color: 'var(--text-faint)' }}
            >
              {icon}
            </div>
            <span className="text-[11px] font-bold transition-colors tracking-wide"
              style={{ color: isActive ? 'var(--accent)' : 'var(--text-faint)', fontFamily: "'Luckiest Guy', sans-serif" }}>
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
          <Route path="/multiplayer/blitz-ai" element={<BlitzAIPage />} />
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
