import React from 'react';
import { Sun, Moon, Contrast } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { clsx } from 'clsx';
import type { Theme } from '../types';

const THEMES: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun size={14} />, label: 'Светлая' },
  { value: 'dark', icon: <Moon size={14} />, label: 'Тёмная' },
  { value: 'contrast', icon: <Contrast size={14} />, label: 'Контраст' },
];

export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const current = THEMES.find(t => t.value === theme)!;
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    return (
      <button
        onClick={() => setTheme(next.value)}
        className="p-2 rounded-xl transition-all hover:scale-110"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        title={`Переключить на: ${next.label}`}
      >
        {current.icon}
      </button>
    );
  }

  return (
    <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      {THEMES.map(t => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            theme === t.value
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
