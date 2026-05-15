import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { Mail, Lock, User, Eye, EyeOff, Github, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

type Mode = 'signin' | 'signup' | 'forgot' | 'verify';

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, signInWithGithub, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/';

  const handleAuthError = (error: { message: string } | null) => {
    if (!error) return;
    const msg = error.message;
    if (msg === 'Failed to fetch' || msg.includes('fetch')) {
      toast.error('Не удалось подключиться к серверу. Проверьте интернет-соединение.', { duration: 5000 });
    } else if (msg.includes('Email not confirmed')) {
      toast.error('Подтвердите email перед входом — проверьте папку Спам.');
    } else if (msg.includes('Invalid login credentials')) {
      toast.error('Неверный email или пароль.');
    } else if (msg.includes('User already registered')) {
      toast.error('Этот email уже зарегистрирован. Войдите или сбросьте пароль.');
    } else if (msg.includes('Password should be at least')) {
      toast.error('Пароль должен быть не менее 6 символов.');
    } else {
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в переменные окружения Netlify.', { duration: 8000 });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) { handleAuthError(error); }
        else { toast.success('Добро пожаловать!'); navigate(from, { replace: true }); }
      } else if (mode === 'signup') {
        if (username.length < 3) { toast.error('Имя должно быть ≥ 3 символов'); return; }
        const { error } = await signUp(email, password, username);
        if (error) { handleAuthError(error); }
        else { setMode('verify'); toast.success('Письмо отправлено! Проверьте почту.'); }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) { handleAuthError(error); }
        else { toast.success('Ссылка для сброса отправлена!'); setMode('signin'); }
      }
    } catch {
      toast.error('Не удалось подключиться к серверу. Проверьте интернет-соединение.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-md w-full game-card text-center p-8">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Подтвердите email
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Мы отправили письмо на <strong>{email}</strong>.
            Перейдите по ссылке в письме для активации аккаунта.
          </p>
          <div className="p-4 rounded-xl bg-blue-500/15 border border-blue-500/30 text-left mb-6">
            <p className="text-xs text-blue-300 font-semibold mb-2">⚠️ Не видите письмо?</p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• Проверьте папку Спам</li>
              <li>• Подождите 2-3 минуты</li>
              <li>• Убедитесь, что адрес верный</li>
            </ul>
          </div>
          <button onClick={() => setMode('signin')} className="btn-primary w-full">
            Перейти к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Decorative background orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-4xl mb-4 mx-auto"
            style={{ background: 'var(--gradient-brand)', boxShadow: '0 8px 32px var(--accent-glow)' }}>
            💣
          </div>
          <h1 className="text-3xl font-black gradient-text mb-1">Minesweeper Pro</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' ? 'Рады снова видеть вас!' :
             mode === 'signup' ? 'Создайте аккаунт бесплатно' :
             'Восстановление пароля'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 p-4 rounded-2xl flex items-start gap-3 text-sm"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <div style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold text-yellow-400">Supabase не настроен.</span>{' '}
              Добавьте <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(0,0,0,0.3)' }}>VITE_SUPABASE_URL</code> и{' '}
              <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(0,0,0,0.3)' }}>VITE_SUPABASE_ANON_KEY</code> в{' '}
              <span className="font-semibold">Site Settings → Environment Variables</span> на Netlify.
            </div>
          </div>
        )}

        <div className="game-card p-7">
          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-1 p-1 rounded-xl mb-7" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setMode('signin')}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200',
                  mode === 'signin'
                    ? 'text-white shadow-lg'
                    : 'hover:text-white/70'
                )}
                style={mode === 'signin'
                  ? { background: 'var(--gradient-brand)', boxShadow: '0 4px 16px var(--accent-glow)', color: 'white' }
                  : { color: 'var(--text-muted)' }}
              >
                Войти
              </button>
              <button
                onClick={() => setMode('signup')}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200',
                  mode === 'signup' ? 'text-white' : 'hover:text-white/70'
                )}
                style={mode === 'signup'
                  ? { background: 'var(--gradient-brand)', boxShadow: '0 4px 16px var(--accent-glow)', color: 'white' }
                  : { color: 'var(--text-muted)' }}
              >
                Регистрация
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {mode === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <div className="spinner border-white/30 border-t-white" />
              ) : mode === 'signin' ? 'Войти' :
                mode === 'signup' ? 'Создать аккаунт' : 'Отправить ссылку'}
            </button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>или</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => signInWithGoogle()}
                  className="btn-secondary w-full py-3 gap-3"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </button>
                <button
                  onClick={() => signInWithGithub()}
                  className="btn-secondary w-full py-3 gap-3"
                >
                  <Github size={18} />
                  Войти через GitHub
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="w-full text-sm mt-4 text-center"
              style={{ color: 'var(--accent)' }}
            >
              ← Вернуться ко входу
            </button>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Играя без аккаунта, ваши результаты не сохраняются
        </p>
      </div>
    </div>
  );
}
