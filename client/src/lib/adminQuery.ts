import { supabaseAdmin } from './supabase';

// ── Types ──────────────────────────────────────────────────
interface QueryResult<T> {
  data: T[];
  error: string | null;
  count: number;
}

// ── SELECT générique ───────────────────────────────────────
export async function adminQuery<T = any>(
  table: string,
  options?: {
    select?: string;
    eq?: Record<string, any>;
    neq?: Record<string, any>;
    inValues?: { column: string; values: any[] };
    order?: { column: string; ascending?: boolean };
    limit?: number;
    ilike?: Record<string, string>;
  }
): Promise<QueryResult<T>> {
  if (!supabaseAdmin) {
    return { data: [], error: 'Supabase non configuré', count: 0 };
  }
  try {
    let query = supabaseAdmin
      .from(table)
      .select(options?.select || '*', { count: 'exact' });

    if (options?.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        query = query.eq(key, value);
      }
    }
    if (options?.neq) {
      for (const [key, value] of Object.entries(options.neq)) {
        query = query.neq(key, value);
      }
    }
    if (options?.inValues) {
      query = query.in(options.inValues.column, options.inValues.values);
    }
    if (options?.ilike) {
      for (const [key, value] of Object.entries(options.ilike)) {
        query = query.ilike(key, `%${value}%`);
      }
    }
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? false,
      });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error(`[adminQuery] ${table}:`, error.message);
      return { data: [], error: error.message, count: 0 };
    }
    return { data: (data || []) as T[], error: null, count: count ?? data?.length ?? 0 };
  } catch (err: any) {
    console.error(`[adminQuery] Exception ${table}:`, err);
    return { data: [], error: err.message, count: 0 };
  }
}

// ── UPDATE ─────────────────────────────────────────────────
export async function adminUpdate(
  table: string,
  id: string,
  updates: Record<string, any>
): Promise<{ error: string | null }> {
  if (!supabaseAdmin) return { error: 'Supabase non configuré' };
  try {
    const { error } = await supabaseAdmin.from(table).update(updates).eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

// ── INSERT ─────────────────────────────────────────────────
export async function adminInsert<T = any>(
  table: string,
  row: Record<string, any>
): Promise<{ data: T | null; error: string | null }> {
  if (!supabaseAdmin) return { data: null, error: 'Supabase non configuré' };
  try {
    const { data, error } = await supabaseAdmin.from(table).insert(row).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

// ── DELETE ──────────────────────────────────────────────────
export async function adminDelete(
  table: string,
  id: string
): Promise<{ error: string | null }> {
  if (!supabaseAdmin) return { error: 'Supabase non configuré' };
  try {
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

// ── RPC (pour fonctions SQL) ───────────────────────────────
export async function adminRpc<T = any>(
  fn: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: string | null }> {
  if (!supabaseAdmin) return { data: null, error: 'Supabase non configuré' };
  try {
    const { data, error } = await supabaseAdmin.rpc(fn, params);
    if (error) return { data: null, error: error.message };
    return { data: data as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
