import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthModal from "./components/AuthModal";
import CookieConsent from "./components/CookieConsent";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <CartProvider>
      <App />
      <AuthModal />
      <CookieConsent />
      <Toaster position="top-center" richColors />
    </CartProvider>
  </AuthProvider>
);
