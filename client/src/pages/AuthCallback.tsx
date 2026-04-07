import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Firebase gère les callbacks OAuth automatiquement via onAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        setLocation("/mon-compte");
      } else {
        setLocation("/");
      }
    });
    return () => unsubscribe();
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
