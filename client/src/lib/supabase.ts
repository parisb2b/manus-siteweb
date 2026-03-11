import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variables d\'environnement manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
    'Les fonctionnalités d\'authentification seront désactivées.'
  );
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
