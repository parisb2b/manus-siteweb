type EventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "quote_request"
  | "auth_signup"
  | "auth_login"
  | "language_switch";

interface AnalyticsEvent {
  type: EventType;
  timestamp: string;
  data?: Record<string, any>;
}

export function trackEvent(type: EventType, data?: Record<string, any>) {
  const event: AnalyticsEvent = {
    type,
    timestamp: new Date().toISOString(),
    data: {
      ...data,
      url: window.location.pathname,
      lang: localStorage.getItem("site_language") || "fr",
    },
  };

  // NOTE: Analytics local désactivé sur Vercel (pas de serveur Node permanent).
  // Les données réelles sont dans Supabase (tables quotes + profiles).
  // L'appel /api/analytics/event est ignoré silencieusement en production.
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {});
  }
}

export function trackPageView(route: string) {
  trackEvent("page_view", { route });
}

export function trackProductView(productId: string, productName: string, category: string) {
  trackEvent("product_view", { product_id: productId, product_name: productName, category });
}

export function trackAddToCart(productId: string, productName: string, price: string, quantity: number) {
  trackEvent("add_to_cart", { product_id: productId, product_name: productName, price, quantity });
}

export function trackRemoveFromCart(productId: string, productName: string) {
  trackEvent("remove_from_cart", { product_id: productId, product_name: productName });
}

export function trackQuoteRequest(cartTotal: number, nbProducts: number) {
  trackEvent("quote_request", { cart_total: cartTotal, nb_products: nbProducts });
}
