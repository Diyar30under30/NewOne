import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGuestStore } from '../store/guestStore';
import { Mail, Lock, User, Eye, EyeOff, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

type Mode = 'signin' | 'signup' | 'forgot' | 'verify';

export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { setGuest } = useGuestStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<Mode>('signin');
  const [guestName, setGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);
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
      {/* Soft decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(196,119,90,0.18) 0%, transparent 70%)', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(122,158,122,0.2) 0%, transparent 70%)', filter: 'blur(60px)', transform: 'translate(-30%, 30%)' }} />

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl text-4xl mb-5 mx-auto"
            style={{ background: 'var(--gradient-brand)', boxShadow: '0 8px 28px var(--accent-glow)' }}>
            💣
          </div>
          <h1 className="serif-heading text-3xl gradient-text mb-1">Minesweeper Pro</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' ? 'Рады снова видеть вас' :
             mode === 'signup' ? 'Создайте аккаунт бесплатно' :
             'Восстановление пароля'}
          </p>
        </div>

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
                {/* Guest mode */}
                {!showGuestInput ? (
                  <button
                    onClick={() => setShowGuestInput(true)}
                    className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    <UserCircle size={18} />
                    Играть как гость
                  </button>
                ) : (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Монеты и история сохраняются локально в браузере
                    </p>
                    <input
                      className="input-field w-full"
                      placeholder="Ваше имя (необязательно)"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setGuest(guestName.trim() || 'Гость');
                          navigate(from, { replace: true });
                        }
                      }}
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setGuest(guestName.trim() || 'Гость');
                        toast.success(`Добро пожаловать, ${guestName.trim() || 'Гость'}!`);
                        navigate(from, { replace: true });
                      }}
                      className="btn-sage w-full py-2.5"
                    >
                      Начать играть
                    </button>
                  </div>
                )}
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
