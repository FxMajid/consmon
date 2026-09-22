import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to strip accidental prefixes like "VITE_SUPABASE_URL=", extra quotes, and trailing spaces
const sanitizeEnvVal = (val?: string): string => {
  if (!val) return '';
  return val
    .trim()
    .replace(/^[A-Z_]+=\s*/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
};

export const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('hbd_supabase_url');
    if (local) return sanitizeEnvVal(local);
  }
  const envUrl = 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) || 
    '';
  return sanitizeEnvVal(envUrl);
};

export const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('hbd_supabase_anon_key');
    if (local) return sanitizeEnvVal(local);
  }
  const envKey = 
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 
    (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) || 
    '';
  return sanitizeEnvVal(envKey);
};

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = getSupabaseAnonKey();

let supabaseInstance: SupabaseClient | null = null;

/**
 * Checks if Supabase credentials have been configured in the environment or localStorage.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    key !== 'your-anon-key' &&
    url.startsWith('https://')
  );
};

/**
 * Lazy initialization of Supabase client to prevent app crash if credentials are not yet set.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, anonKey: string): boolean => {
  if (typeof window === 'undefined') return false;
  const cleanUrl = sanitizeEnvVal(url);
  const cleanKey = sanitizeEnvVal(anonKey);
  if (!cleanUrl || !cleanKey || !cleanUrl.startsWith('https://')) return false;

  localStorage.setItem('hbd_supabase_url', cleanUrl);
  localStorage.setItem('hbd_supabase_anon_key', cleanKey);
  supabaseInstance = null; // reset cached instance
  return true;
};

export const clearSupabaseConfig = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hbd_supabase_url');
    localStorage.removeItem('hbd_supabase_anon_key');
  }
  supabaseInstance = null;
};

export const supabase = getSupabase();

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
  isCustomLocal: boolean;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const isCustom = typeof window !== 'undefined' && Boolean(localStorage.getItem('hbd_supabase_url'));
  return {
    isConfigured: isSupabaseConfigured(),
    url: url || '',
    hasAnonKey: Boolean(key),
    isCustomLocal: isCustom,
  };
};
