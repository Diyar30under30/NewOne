import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, Camera, MapPin, Shield, LogOut, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Statistics } from '../components/Statistics';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export function ProfilePage() {
  const { user, profile, signOut, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Войдите для просмотра профиля</p>
          <button onClick={() => navigate('/auth')} className="btn-primary">
            Войти
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ username, city });
    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('Профиль обновлён!');
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 2MB)');
      return;
    }
    setAvatarUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Аватар обновлён!');
    } else {
      toast.error('Ошибка загрузки аватара');
    }
    setAvatarUploading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('До свидания!');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="game-card">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-white font-bold">
                    {profile.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:bg-blue-400 transition-colors shadow-lg">
                {avatarUploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={14} className="text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="input-field text-base font-bold"
                    placeholder="Имя пользователя"
                  />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="input-field text-sm"
                    placeholder="Город (необязательно)"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} disabled={saving} className="btn-primary py-2 text-sm flex-1">
                      {saving ? <div className="spinner border-white/30 border-t-white" /> : <><Save size={14} /> Сохранить</>}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary py-2 text-sm">
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {profile.username}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                  {profile.city && (
                    <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin size={13} /> {profile.city}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {profile.is_pro && (
                      <span className="badge bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        ⭐ PRO
                      </span>
                    )}
                    <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      🪙 {profile.coins} монет
                    </span>
                  </div>
                  <button onClick={() => setEditing(true)} className="mt-3 text-xs" style={{ color: 'var(--accent)' }}>
                    ✏️ Редактировать профиль
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="game-card">
          <h3 className="font-bold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>🎨 Тема оформления</h3>
          <ThemeSwitcher />
        </div>

        {/* Account actions */}
        <div className="game-card space-y-3">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>⚙️ Аккаунт</h3>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <LogOut size={18} className="text-orange-400" />
            <span>Выйти из аккаунта</span>
          </button>
        </div>

        {/* Pro upgrade teaser */}
        {!profile.is_pro && (
          <div className="game-card bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>🌟 Upgrade to Pro</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Без рекламы, неограниченный AI, мультиплеер
                </p>
              </div>
              <button
                onClick={() => navigate('/store')}
                className="btn-primary text-sm whitespace-nowrap"
              >
                от $4.99
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
