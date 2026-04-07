import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/FirebaseAuthContext";
import AuthModal from "./components/AuthModal";
import CookieConsent from "./components/CookieConsent";
import { Toaster } from "sonner";

// ── ErrorBoundary global ──────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
          <h1 style={{ color: "#b91c1c", marginBottom: "1rem" }}>Une erreur est survenue</h1>
          <p style={{ color: "#555", marginBottom: "1rem" }}>
            {this.state.error?.message || "Erreur inconnue"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#4A90D9",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <App />
        <AuthModal />
        <CookieConsent />
        <Toaster position="top-center" richColors />
      </CartProvider>
    </AuthProvider>
  </ErrorBoundary>
);
