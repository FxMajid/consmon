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

// Retrieve credentials safely from client-side environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = sanitizeEnvVal(rawUrl);
export const supabaseAnonKey = sanitizeEnvVal(rawKey);

let supabaseInstance: SupabaseClient | null = null;

/**
 * Checks if Supabase credentials have been configured in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseUrl.startsWith('https://')
  );
};

/**
 * Lazy initialization of Supabase client to prevent app crash if credentials are not yet set.
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseInstance;
};

export const supabase = getSupabase();

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  return {
    isConfigured: isSupabaseConfigured(),
    url: supabaseUrl || '',
    hasAnonKey: Boolean(supabaseAnonKey),
  };
};
