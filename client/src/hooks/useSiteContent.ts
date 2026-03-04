import { useState, useEffect } from "react";

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
  try {
    const res = await fetch("/api/site-content");
    if (res.ok) {
      const data = await res.json();
      cachedContent = data;
      cacheTimestamp = Date.now();
      return data;
    }
  } catch {}
  const { default: fallback } = await import("@/data/site-content.json");
  cachedContent = fallback as SiteContent;
  cacheTimestamp = Date.now();
  return cachedContent;
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

export function invalidateSiteContentCache() {
  cachedContent = null;
  cacheTimestamp = 0;
}
