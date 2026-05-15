import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, User, Eye, EyeOff, Github } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            toast.error('Подтвердите email перед входом! Проверьте почту.');
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Неверный email или пароль');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Добро пожаловать!');
          navigate(from, { replace: true });
        }
      } else if (mode === 'signup') {
        if (username.length < 3) {
          toast.error('Имя пользователя должно быть не менее 3 символов');
          return;
        }
        const { data, error } = await signUp(email, password, username);
        if (error) {
          toast.error(error.message);
        } else {
          setMode('verify');
          toast.success('Письмо отправлено! Проверьте почту.');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Ссылка для сброса отправлена на почту!');
          setMode('signin');
        }
      }
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💣</div>
          <h1 className="text-2xl font-black gradient-text">Minesweeper Pro</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' ? 'Рады снова видеть вас!' :
             mode === 'signup' ? 'Создайте аккаунт бесплатно' :
             'Восстановление пароля'}
          </p>
        </div>

        <div className="game-card p-6">
          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-secondary)' }}>
              <button
                onClick={() => setMode('signin')}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === 'signin' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                Войти
              </button>
              <button
                onClick={() => setMode('signup')}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === 'signup' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                )}
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
