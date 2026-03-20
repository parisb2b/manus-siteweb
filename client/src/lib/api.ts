/**
 * lib/api.ts — OBSOLÈTE
 *
 * Ce fichier appelait des routes /api/ (Node.js) qui ne fonctionnent pas
 * sur Vercel (SPA statique). Il n'est plus importé dans le projet.
 *
 * Remplacé par :
 * - hooks/useProducts.ts  → Supabase table `products`
 * - hooks/useSiteContent.ts → Supabase table `site_content`
 * - Pour les produits admin : AdminProducts.tsx accède directement à Supabase
 *
 * Conservé pour éviter une erreur si un import résiduel existe.
 */

import type { Product } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";

/** @deprecated Utiliser useProducts() hook — Supabase-first */
export async function fetchProducts(): Promise<Product[]> {
  if (supabase) {
    const { data } = await supabase.from("products").select("*").eq("actif", true);
    if (data && data.length > 0) return data as unknown as Product[];
  }
  const { default: fallback } = await import("@/data/products.json");
  return fallback as Product[];
}

/** @deprecated Non implémenté sur Vercel */
export async function fetchProduct(_id: string): Promise<Product | null> {
  return null;
}

/** @deprecated Non implémenté sur Vercel — utiliser Supabase directement */
export async function saveProducts(_products: Product[]): Promise<boolean> {
  return false;
}

/** @deprecated Non implémenté sur Vercel */
export async function saveProduct(_product: Product): Promise<boolean> {
  return false;
}

/** @deprecated Utiliser Supabase table site_content */
export async function fetchSettings(): Promise<any> {
  const { default: settings } = await import("@/data/settings.json");
  return settings;
}

/** @deprecated Non implémenté sur Vercel */
export async function saveSettings(_settings: any): Promise<boolean> {
  return false;
}
