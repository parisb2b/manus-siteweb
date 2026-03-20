import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface SiteContent {
  siteSettings: {
    siteName: string;
    logo: string;
    primaryColor: string;
    whatsappNumber: string;
    topBanner: string;
    footerText: string;
    footerDescription: string;
    contactEmail: string;
    contactPhone: string;
    metaDescription: string;
    faviconUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
  };
  navigation: {
    menuItems: { label: string; path: string; visible: boolean }[];
  };
  pages: Record<string, any>;
  pagesConfig?: Record<string, { enabled: boolean; label: string }>;
  shipping: {
    pricePerCubicMeter: number;
    destinations: { name: string; container20?: number; container40?: number; onQuote?: boolean }[];
    containers: {
      twenty: { volume: number; label: string };
      forty: { volume: number; label: string };
    };
  };
}

let cachedContent: SiteContent | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000;

async function loadSiteContent(): Promise<SiteContent> {
  const now = Date.now();
  if (cachedContent && now - cacheTimestamp < CACHE_TTL) {
    return cachedContent;
  }
  // 1. Essayer Supabase (production)
  try {
    if (supabase) {
      const { data: row } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "site_content")
        .maybeSingle();
      if (row?.value) {
        cachedContent = row.value as SiteContent;
        cacheTimestamp = Date.now();
        return cachedContent;
      }
    }
  } catch {}
  // 2. Fallback JSON local
  try {
    const { default: fallback } = await import("@/data/site-content.json");
    cachedContent = fallback as SiteContent;
    cacheTimestamp = Date.now();
    return cachedContent;
  } catch {}
  return cachedContent!;
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(cachedContent);
  const [loading, setLoading] = useState(!cachedContent);

  useEffect(() => {
    loadSiteContent().then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, []);

  return { content, loading };
}

export function usePageContent(pageKey: string) {
  const { content, loading } = useSiteContent();
  return {
    page: content?.pages?.[pageKey] || null,
    settings: content?.siteSettings || null,
    navigation: content?.navigation || null,
    shipping: content?.shipping || null,
    loading,
  };
}

const PATH_TO_PAGE_KEY: Record<string, string> = {
  "/minipelles": "minipelles",
  "/maisons": "maisons",
  "/maisons/standard": "maisons",
  "/maisons/premium": "maisons",
  "/maisons/camping-car-deluxe": "maisons",
  "/solaire": "solaire",
  "/agricole": "agricole",
  "/accessoires": "accessoires",
  "/services": "services",
  "/contact": "contact",
  "/about": "about",
  "/terms": "terms",
  "/privacy": "privacy",
  "/legal": "legal",
};

export function getPageKeyFromPath(path: string): string | null {
  return PATH_TO_PAGE_KEY[path] || null;
}

export function isPageEnabled(content: SiteContent | null, pageKey: string): boolean {
  if (!content?.pagesConfig) return true;
  return content.pagesConfig[pageKey]?.enabled ?? true;
}

export function invalidateSiteContentCache() {
  cachedContent = null;
  cacheTimestamp = 0;
}
