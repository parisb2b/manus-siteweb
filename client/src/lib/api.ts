import type { Product } from "@/hooks/useProducts";

// === Products API ===
export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products");
    if (res.ok) return await res.json();
  } catch {}
  const { default: products } = await import("@/data/products.json");
  return products as Product[];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function saveProducts(products: Product[]): Promise<boolean> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products),
  });
  return res.ok;
}

export async function saveProduct(product: Product): Promise<boolean> {
  const res = await fetch(`/api/products/${product.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  return res.ok;
}

// === Settings API ===
export async function fetchSettings(): Promise<any> {
  try {
    const res = await fetch("/api/settings");
    if (res.ok) return await res.json();
  } catch {}
  const { default: settings } = await import("@/data/settings.json");
  return settings;
}

export async function saveSettings(settings: any): Promise<boolean> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return res.ok;
}
