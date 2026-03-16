import { useState, useEffect } from "react";

// === Full Product Interface ===
export interface GalleryItem {
  type: "image" | "video";
  src: string;
  alt?: string;
}

export interface SpecRow {
  label: string;
  value: string;
}

export interface SizeOption {
  id: string;
  name: string;
  price: number;
  approxM2?: number;
  shipping?: Record<string, number>;
}

export interface ProductOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  isQuote?: boolean;
  volume?: number;
}

export interface Destination {
  id: string;
  name: string;
  price?: number | null;
}

export interface AccessoryModel {
  name: string;
  options: { size: string; price: string }[];
}

export interface Product {
  // Base fields
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  image: string;
  link: string;
  category: string;
  subcategory: string;
  active: boolean;

  // Rich content
  longDescription?: string;
  features?: string[];
  pdf?: string;
  seoTitle?: string;
  seoDescription?: string;

  // Media
  gallery?: GalleryItem[];

  // Specs
  specs: Record<string, string>;
  detailedSpecs?: Record<string, SpecRow[]>;

  // House-specific
  sizes?: SizeOption[];
  options?: ProductOption[];
  destinations?: Destination[];
  techSpecs?: SpecRow[];

  // Accessory-specific
  models?: AccessoryModel[];

  // Allow extra fields
  [key: string]: any;
}

// === Cache ===
let cachedProducts: Product[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000;

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = Date.now();

    if (cachedProducts && now - cacheTimestamp < CACHE_TTL) {
      const filtered = category
        ? cachedProducts.filter((p) => p.category === category && p.active)
        : cachedProducts.filter((p) => p.active);
      setProducts(filtered);
      setLoading(false);
      return;
    }

    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        cachedProducts = data;
        cacheTimestamp = Date.now();
        const filtered = category
          ? data.filter((p) => p.category === category && p.active)
          : data.filter((p) => p.active);
        setProducts(filtered);
      })
      .catch(async () => {
        try {
          const mod = await import("@/data/products.json");
          const data = mod.default as Product[];
          const filtered = category
            ? data.filter((p) => p.category === category && p.active)
            : data.filter((p) => p.active);
          setProducts(filtered);
        } catch {
          // JSON fallback also failed — leave products empty
        }
      })
      .finally(() => setLoading(false));
  }, [category]);

  return { products, loading };
}

// === Single product hook ===
export function useProduct(id: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: Product) => setProduct(data))
      .catch(async () => {
        // Fallback: search directly in bundled JSON
        try {
          const mod = await import("@/data/products.json");
          const data = mod.default as Product[];
          const found = data.find((p) => p.id === id) || null;
          setProduct(found);
        } catch {
          setProduct(null);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return { product, loading };
}

// === Cache invalidation ===
export function invalidateProductsCache() {
  cachedProducts = null;
  cacheTimestamp = 0;
}
