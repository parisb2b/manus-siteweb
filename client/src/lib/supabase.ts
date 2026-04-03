import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Initialisation paresseuse (lazy) — jamais null si les vars sont présentes ──
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  if (supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: '97import-client-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return _supabase;
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin;
  if (supabaseUrl && supabaseAnonKey) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: '97import-admin-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return _supabaseAdmin;
}

/** Client Supabase principal (site + espace client) */
export const supabase: SupabaseClient | null = getSupabase();

/** Client Supabase pour le back-office admin (session isolée) */
export const supabaseAdmin: SupabaseClient | null = getSupabaseAdmin();

/** Accesseur garanti non-null — lève une erreur explicite si non configuré */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error('[Supabase] Non configuré — variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes.');
  return client;
}

/** Accesseur admin garanti non-null */
export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) throw new Error('[SupabaseAdmin] Non configuré — variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes.');
  return client;
}

if (!supabase) {
  console.warn(
    '[Supabase] Variables d\'environnement manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'Les fonctionnalités d\'authentification seront désactivées.'
  );
}
