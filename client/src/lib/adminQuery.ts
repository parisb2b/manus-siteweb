/**
 * adminQuery.ts — Requêtes Firestore génériques pour le back-office
 * Remplace l'ancien adminQuery Supabase — API compatible
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  type Query,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

interface QueryResult<T> {
  data: T[];
  error: string | null;
  count: number;
}

function docToObj<T>(snap: { id: string; data: () => DocumentData }): T {
  return { id: snap.id, ...snap.data() } as T;
}

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
  try {
    const constraints: any[] = [];

    if (options?.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        constraints.push(where(key, "==", value));
      }
    }
    if (options?.neq) {
      for (const [key, value] of Object.entries(options.neq)) {
        constraints.push(where(key, "!=", value));
      }
    }
    if (options?.inValues) {
      constraints.push(
        where(options.inValues.column, "in", options.inValues.values)
      );
    }
    if (options?.order) {
      constraints.push(
        orderBy(
          options.order.column,
          options.order.ascending ? "asc" : "desc"
        )
      );
    }
    if (options?.limit) {
      constraints.push(firestoreLimit(options.limit));
    }

    const q: Query<DocumentData> =
      constraints.length > 0
        ? query(collection(db, table), ...constraints)
        : collection(db, table);

    const snapshot = await getDocs(q);
    let data = snapshot.docs.map((d) => docToObj<T>(d));

    if (options?.ilike) {
      for (const [key, value] of Object.entries(options.ilike)) {
        const lower = value.toLowerCase();
        data = data.filter((item: any) =>
          String(item[key] ?? "").toLowerCase().includes(lower)
        );
      }
    }

    return { data, error: null, count: data.length };
  } catch (err: any) {
    console.error(`[adminQuery] ${table}:`, err);
    return { data: [], error: err.message, count: 0 };
  }
}

export async function adminUpdate(
  table: string,
  id: string,
  updates: Record<string, any>
): Promise<{ error: string | null }> {
  try {
    await updateDoc(doc(db, table, id), {
      ...updates,
      updated_at: serverTimestamp(),
    });
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function adminInsert<T = any>(
  table: string,
  row: Record<string, any>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const ref = await addDoc(collection(db, table), {
      ...row,
      created_at: serverTimestamp(),
    });
    return { data: { id: ref.id, ...row } as T, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

export async function adminDelete(
  table: string,
  id: string
): Promise<{ error: string | null }> {
  try {
    await deleteDoc(doc(db, table, id));
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getNextDevisNumero(): Promise<string> {
  try {
    const { data } = await adminQuery("quotes", {
      order: { column: "created_at", ascending: false },
      limit: 1,
    });
    if (data.length > 0 && (data[0] as any).numero_devis) {
      const last = parseInt(
        String((data[0] as any).numero_devis).replace(/\D/g, ""),
        10
      );
      if (!isNaN(last)) return String(last + 1).padStart(5, "0");
    }
    return "00001";
  } catch {
    return "00001";
  }
}

export async function adminRpc<T = any>(
  fn: string,
  _params?: Record<string, any>
): Promise<{ data: T | null; error: string | null }> {
  if (fn === "get_next_devis_numero") {
    const num = await getNextDevisNumero();
    return { data: num as unknown as T, error: null };
  }
  console.warn(`[adminRpc] Fonction "${fn}" non implémentée dans Firestore`);
  return { data: null, error: `RPC "${fn}" non supporté` };
}
