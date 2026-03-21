import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        setLocation("/");
        return;
      }

      // Récupérer le code PKCE depuis l'URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        // Échanger le code contre une session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setLocation("/");
          return;
        }
      }

      // Vérifier la session résultante
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLocation("/mon-compte");
      } else {
        setLocation("/");
      }
    };

    handleCallback();
  }, [setLocation]);

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
