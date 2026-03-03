import { mmkv } from '@/lib/storage';
import type { Database } from '@/types/database';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Custom MMKV-backed storage adapter for Supabase Auth.
 * Uses MMKV instead of AsyncStorage for better performance.
 */
const MMKVStorageAdapter = {
  getItem: (key: string): string | null => {
    return mmkv.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    mmkv.setString(key, value);
  },
  removeItem: (key: string): void => {
    mmkv.delete(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MMKVStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
