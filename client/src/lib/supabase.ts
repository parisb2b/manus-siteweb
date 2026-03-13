import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- DEBUG TEMPORAIRE ---
console.log('[Supabase] URL:', import.meta.env.VITE_SUPABASE_URL ? 'présent' : 'absent');
console.log('[Supabase] KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'présent' : 'absent');
// --- FIN DEBUG ---

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
  console.warn(
    '[Supabase] Variables d\'environnement manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'Les fonctionnalités d\'authentification seront désactivées.'
  );
}
