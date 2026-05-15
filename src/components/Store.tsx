import React, { useState } from 'react';
import { ShoppingBag, Coins, Check, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import type { Skin } from '../types';
import { useUIStore } from '../store/uiStore';
import toast from 'react-hot-toast';

const SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Классика',
    type: 'complete',
    price_coins: 0,
    css_class: 'skin-classic',
    emoji: '🎮',
    description: 'Оригинальный стиль Windows',
  },
  {
    id: 'cyberpunk',
    name: 'Киберпанк',
    type: 'complete',
    price_coins: 200,
    css_class: 'skin-cyberpunk',
    emoji: '⚡',
    description: 'Неоновый стиль будущего',
  },
  {
    id: 'space',
    name: 'Космос',
    type: 'complete',
    price_coins: 250,
    css_class: 'skin-space',
    emoji: '🚀',
    description: 'Галактические поля',
  },
  {
    id: 'pixel',
    name: 'Пиксель Арт',
    type: 'complete',
    price_coins: 150,
    css_class: 'skin-pixel',
    emoji: '👾',
    description: '8-битная ностальгия',
  },
  {
    id: 'xmas',
    name: 'Новогодний',
    type: 'complete',
    price_coins: 100,
    css_class: 'skin-xmas',
    emoji: '🎄',
    description: 'Праздничные мины',
  },
  {
    id: 'cute',
    name: 'Милый',
    type: 'complete',
    price_coins: 175,
    css_class: 'skin-cute',
    emoji: '🌸',
    description: 'Розовый и уютный',
  },
];

interface StoreProps {
  userCoins: number;
  ownedSkins: string[];
  equippedSkin: string;
  onPurchase: (skinId: string, price: number) => Promise<boolean>;
  onEquip: (skinId: string) => void;
}

function MiniPreview({ skinId }: { skinId: string }) {
  const skinClass = `skin-${skinId}`;
  const cells = [false, true, false, false, true, false, false, false, false];
  return (
    <div className={clsx('inline-grid gap-0.5 p-1 rounded-md', skinClass)} style={{ gridTemplateColumns: 'repeat(3, 18px)' }}>
      {cells.map((open, i) => (
        <div
          key={i}
          className={clsx(
            'rounded-sm flex items-center justify-center text-[8px]',
            open ? 'cell-open' : 'cell-closed'
          )}
          style={{ width: 18, height: 18 }}
        >
          {i === 1 && <span className="cell-flag">🚩</span>}
          {i === 4 && <span className="num-2">2</span>}
        </div>
      ))}
    </div>
  );
}

export function Store({ userCoins, ownedSkins, equippedSkin, onPurchase, onEquip }: StoreProps) {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const { setActiveSkin } = useUIStore();

  const handlePurchase = async (skin: Skin) => {
    if (userCoins < skin.price_coins) {
      toast.error(`Нужно ${skin.price_coins} монет. У вас: ${userCoins}`);
      return;
    }
    setPurchasing(skin.id);
    const ok = await onPurchase(skin.id, skin.price_coins);
    if (ok) {
      toast.success(`Куплен скин «${skin.name}»! 🎉`);
    } else {
      toast.error('Ошибка покупки');
    }
    setPurchasing(null);
  };

  const handleEquip = (skin: Skin) => {
    onEquip(skin.id);
    setActiveSkin(skin.id);
    toast.success(`Скин «${skin.name}» применён!`);
  };

  return (
    <div className="game-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ShoppingBag size={18} className="text-purple-400" />
          Магазин скинов
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30">
          <span className="text-yellow-400">🪙</span>
          <span className="font-bold text-yellow-400 text-sm">{userCoins}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SKINS.map(skin => {
          const owned = ownedSkins.includes(skin.id) || skin.price_coins === 0;
          const equipped = equippedSkin === skin.id;
          const canAfford = userCoins >= skin.price_coins;

          return (
            <div
              key={skin.id}
              className={clsx(
                'p-3 rounded-xl border text-center transition-all duration-200',
                equipped
                  ? 'bg-blue-500/20 border-blue-500/60 shadow-lg shadow-blue-500/20'
                  : 'border-gray-700/50 hover:border-gray-500'
              )}
              style={!equipped ? { background: 'var(--bg-secondary)' } : undefined}
            >
              <div className="text-2xl mb-2">{skin.emoji}</div>
              <div className="mb-2">
                <MiniPreview skinId={skin.id} />
              </div>
              <div className="font-semibold text-xs mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {skin.name}
              </div>
              <div className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                {skin.description}
              </div>

              {equipped ? (
                <div className="flex items-center justify-center gap-1 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold">
                  <Check size={12} /> Надет
                </div>
              ) : owned ? (
                <button
                  onClick={() => handleEquip(skin)}
                  className="w-full py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-400 transition-colors"
                >
                  Надеть
                </button>
              ) : (
                <button
                  onClick={() => handlePurchase(skin)}
                  disabled={!canAfford || purchasing === skin.id}
                  className={clsx(
                    'w-full py-1.5 rounded-lg text-xs font-bold transition-all',
                    canAfford
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {purchasing === skin.id ? (
                    <span className="flex items-center justify-center gap-1">
                      <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      {canAfford ? null : <Lock size={10} />}
                      🪙 {skin.price_coins}
                    </span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
