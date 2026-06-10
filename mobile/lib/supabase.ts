import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const supabaseAnonKey  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// supabase-js v2 throws synchronously if either value is an empty string, which
// crashes the app at module-load time before any component mounts. Guard here so
// a missing EAS secret degrades to network errors rather than a hard startup crash.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[CafeLocco] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing from ' +
    'this build. Set them as EAS secrets: eas secret:set --scope project. ' +
    'All Supabase calls will fail until credentials are present.',
  );
}

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Use non-empty sentinel strings so createClient does not throw on missing credentials.
// Network calls will return errors (not crash the app) until real values are provided.
export const supabase = createClient(
  supabaseUrl  || 'https://missing-credentials.invalid',
  supabaseAnonKey || 'missing-credentials',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
