import React, { useState } from 'react';
import { saveCredentials } from '../lib/supabaseClient';

export default function SetupPage() {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimUrl = url.trim();
    const trimKey = key.trim();
    if (!trimUrl.startsWith('https://') || !trimUrl.includes('.supabase.co')) {
      setError('URL must look like https://xxxx.supabase.co');
      return;
    }
    if (!trimKey.startsWith('eyJ')) {
      setError('Anon key should start with eyJ...');
      return;
    }
    saveCredentials(trimUrl, trimKey);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="game-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💣</div>
          <h1 className="serif-heading text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Minesweeper Pro
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Paste your Supabase credentials to connect the backend
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              SUPABASE PROJECT URL
            </label>
            <input
              className="input-field w-full"
              type="url"
              placeholder="https://xxxx.supabase.co"
              value={url}
              onChange={e => { setUrl(e.target.value); setError(''); }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              ANON / PUBLIC KEY
            </label>
            <textarea
              className="input-field w-full resize-none font-mono text-xs"
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full py-3">
            Connect & Launch
          </button>
        </form>

        <div className="mt-6 p-4 rounded-xl text-xs space-y-1" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Where to find these?</p>
          <p>1. Go to <strong>supabase.com</strong> → your project</p>
          <p>2. Click <strong>Settings → API</strong></p>
          <p>3. Copy <strong>Project URL</strong> and <strong>anon / public</strong> key</p>
        </div>
      </div>
    </div>
  );
}
