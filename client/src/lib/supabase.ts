import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Client Supabase principal (site + espace client) */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storageKey: '97import-client-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      })
    : null;

/** Client Supabase pour le back-office admin (session isolée) */
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storageKey: '97import-admin-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      })
    : null;

if (!supabase) {
  console.warn(
    '[Supabase] Variables d\'environnement manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'Les fonctionnalités d\'authentification seront désactivées.'
  );
}
