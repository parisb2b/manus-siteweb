import { useState } from "react";
import { useLocation } from "wouter";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Supabase non configuré.");
      setLoading(false);
      return;
    }

    // 1. Authentification
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    console.log("[AdminLogin] Auth OK — user:", authData.user.email, "id:", authData.user.id);

    // 2. Lire le profil — capturer l'erreur explicitement
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    console.log("[AdminLogin] Profile query result:", { profile, profileError: profileError?.message });

    // 3. Si la requête profiles échoue (RLS, réseau, etc.) : ne PAS refuser l'accès
    if (profileError) {
      console.error("[AdminLogin] Erreur lecture profil:", profileError.message, profileError.code);
      // Fallback : essayer par email (contourne un éventuel problème de RLS sur id)
      const { data: profileByEmail, error: emailErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", email)
        .maybeSingle();

      console.log("[AdminLogin] Fallback par email:", { profileByEmail, emailErr: emailErr?.message });

      if (profileByEmail && (profileByEmail.role === "admin" || profileByEmail.role === "collaborateur")) {
        setLocation("/admin/dashboard");
        return;
      }

      // Si même le fallback échoue, montrer l'erreur technique
      await supabase.auth.signOut();
      setError(`Erreur de lecture du profil : ${profileError.message}. Vérifier les policies RLS sur la table profiles dans Supabase.`);
      setLoading(false);
      return;
    }

    // 4. Profil null (pas d'erreur mais pas de ligne = profil inexistant)
    if (!profile) {
      console.warn("[AdminLogin] Profil introuvable pour user id:", authData.user.id);
      await supabase.auth.signOut();
      setError("Aucun profil trouvé pour cet utilisateur. Contacter l'administrateur.");
      setLoading(false);
      return;
    }

    // 5. Vérification du rôle
    console.log("[AdminLogin] Rôle trouvé:", profile.role);
    if (profile.role !== "admin" && profile.role !== "collaborateur") {
      await supabase.auth.signOut();
      setError(`Accès refusé — votre rôle est "${profile.role}". Seuls admin et collaborateur sont autorisés.`);
      setLoading(false);
      return;
    }

    // 6. Succès → redirection
    console.log("[AdminLogin] Accès autorisé — redirection vers /admin/dashboard");
    setLocation("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans">
      <div className="bg-[#1A1A2E] text-white py-4 px-6 shadow-lg">
        <h1 className="text-xl font-bold tracking-wide">97 import - Administration</h1>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#4A90D9] rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Administration</h2>
          <p className="text-gray-500 text-center mb-8">
            Connectez-vous pour accéder au panneau d'administration
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none transition-all text-gray-800"
                  placeholder="admin@97import.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none transition-all text-gray-800"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Accès réservé aux administrateurs et collaborateurs
          </p>
        </div>
      </div>
    </div>
  );
}
