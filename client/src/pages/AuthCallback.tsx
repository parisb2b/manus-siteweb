import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Page de callback OAuth (Google, Facebook, etc.)
 * Supabase redirige ici après l'authentification sociale avec ?code=xxx.
 * Le client Supabase JS détecte et échange automatiquement le code
 * lors de l'initialisation (detectSessionInUrl: true par défaut).
 * AuthContext met à jour user/session via onAuthStateChange.
 * Cette page attend la résolution et redirige vers /mon-compte ou /.
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        setLocation("/mon-compte");
      } else {
        // Échange du code non résolu ou erreur → retour à l'accueil
        setLocation("/");
      }
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#4A90D9] mx-auto mb-4" />
        <p className="text-gray-600 font-semibold text-lg">Connexion en cours…</p>
        <p className="text-gray-400 text-sm mt-2">Vous allez être redirigé automatiquement.</p>
      </div>
    </div>
  );
}
