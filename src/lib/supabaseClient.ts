import { createClient } from '@supabase/supabase-js';

const LS_URL_KEY = 'sb_url';
const LS_KEY_KEY = 'sb_anon_key';

function getCredentials() {
  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem(LS_URL_KEY) || '';
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem(LS_KEY_KEY) || '';
  return { url, key };
}

export function saveCredentials(url: string, key: string) {
  localStorage.setItem(LS_URL_KEY, url);
  localStorage.setItem(LS_KEY_KEY, key);
  window.location.reload();
}

export function clearCredentials() {
  localStorage.removeItem(LS_URL_KEY);
  localStorage.removeItem(LS_KEY_KEY);
  window.location.reload();
}

const { url: supabaseUrl, key: supabaseAnonKey } = getCredentials();

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

export type SupabaseClient = typeof supabase;
