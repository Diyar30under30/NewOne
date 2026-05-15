import React, { useState, useEffect } from 'react';
import { Store } from '../components/Store';
import { Leaderboard } from '../components/Leaderboard';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { supabase } from '../lib/supabaseClient';
import { ShoppingBag, Star, Zap, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const PRO_PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$4.99/мес',
    color: 'from-blue-500 to-purple-500',
    icon: <Star size={20} />,
    features: [
      'Без рекламы',
      'Неограниченные AI-подсказки',
      'Голосовой AI-коуч',
      'Мультиплеер',
      '3 эксклюзивных скина',
      'Кланы',
    ],
  },
  {
    id: 'pro_plus',
    name: 'Pro+',
    price: '$9.99/мес',
    color: 'from-yellow-500 to-orange-500',
    icon: <Crown size={20} />,
    features: [
      'Всё из Pro',
      'Супер-скин «Легенда»',
      'Ранний доступ к функциям',
      'Приоритетная поддержка',
      'Battle Pass включён',
      'Двойные монеты за победы',
    ],
    popular: true,
  },
];

export function StorePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { activeSkinId, setActiveSkin } = useUIStore();
  const navigate = useNavigate();
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['classic']);
  const [activeTab, setActiveTab] = useState<'skins' | 'pro' | 'leaderboard'>('skins');

  useEffect(() => {
    if (user) loadOwnedSkins();
  }, [user]);

  const loadOwnedSkins = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_skins')
      .select('skin_id')
      .eq('user_id', user.id);
    setOwnedSkins(['classic', ...(data?.map((s: { skin_id: string }) => s.skin_id) ?? [])]);
  };

  const handlePurchase = async (skinId: string, price: number): Promise<boolean> => {
    if (!user || !profile) return false;
    if (profile.coins < price) return false;

    const { error } = await supabase.from('user_skins').insert({
      user_id: user.id,
      skin_id: skinId,
      equipped: false,
      purchased_at: new Date().toISOString(),
    });

    if (error) return false;

    await supabase.from('profiles')
      .update({ coins: profile.coins - price })
      .eq('id', user.id);

    await refreshProfile();
    setOwnedSkins(prev => [...prev, skinId]);
    return true;
  };

  const handleEquip = async (skinId: string) => {
    if (!user) return;
    await supabase.from('user_skins')
      .update({ equipped: false })
      .eq('user_id', user.id);

    if (skinId !== 'classic') {
      await supabase.from('user_skins')
        .update({ equipped: true })
        .eq('user_id', user.id)
        .eq('skin_id', skinId);
    }

    await supabase.from('profiles')
      .update({ skin_id: skinId })
      .eq('id', user.id);

    setActiveSkin(skinId);
  };

  const handleUpgrade = (planId: string) => {
    toast('Stripe интеграция требует настройки backend. Скоро!', { icon: '💳' });
  };

  const TABS = [
    { id: 'skins' as const, label: '🎨 Скины', icon: <ShoppingBag size={16} /> },
    { id: 'pro' as const, label: '⭐ Pro', icon: <Star size={16} /> },
    { id: 'leaderboard' as const, label: '🏆 Рейтинг', icon: <Zap size={16} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label.split(' ')[1]}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Skins */}
        {activeTab === 'skins' && (
          <Store
            userCoins={profile?.coins ?? 0}
            ownedSkins={ownedSkins}
            equippedSkin={profile?.skin_id ?? activeSkinId}
            onPurchase={handlePurchase}
            onEquip={handleEquip}
          />
        )}

        {/* Pro plans */}
        {activeTab === 'pro' && (
          <div className="space-y-4">
            {profile?.is_pro && (
              <div className="p-4 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center gap-3">
                <Crown size={24} className="text-yellow-400" />
                <div>
                  <div className="font-bold text-yellow-400">Вы уже Pro!</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Подписка активна до {profile.pro_expires_at ? new Date(profile.pro_expires_at).toLocaleDateString('ru') : '—'}
                  </div>
                </div>
              </div>
            )}

            {PRO_PLANS.map(plan => (
              <div
                key={plan.id}
                className={clsx(
                  'game-card relative overflow-hidden',
                  plan.popular ? 'border-yellow-500/50' : ''
                )}
              >
                {plan.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="badge bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px]">
                      🔥 Популярный
                    </span>
                  </div>
                )}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} text-white mb-3`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {plan.name}
                </h3>
                <div className="text-2xl font-black text-blue-400 mb-4">{plan.price}</div>
                <ul className="space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={clsx(
                    'w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90',
                    `bg-gradient-to-r ${plan.color}`
                  )}
                >
                  Попробовать 7 дней бесплатно
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  );
}
