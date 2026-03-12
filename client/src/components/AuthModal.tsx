import { useState } from "react";
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// SVG Icons for social providers
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
    <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
    <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
    <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
  </svg>
);

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, signUp, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Register form
  const [registerForm, setRegisterForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
  });

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  if (!showAuthModal) return null;

  const handleSocialLogin = async (provider: "google" | "facebook" | "apple" | "azure") => {
    if (!supabase) {
      setError("Supabase non configuré. Connexion sociale indisponible.");
      return;
    }
    setSocialLoading(provider);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message || "Erreur lors de la connexion sociale.");
    }
    setSocialLoading(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!registerForm.nom || !registerForm.prenom || !registerForm.email || !registerForm.password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    const { error } = await signUp(registerForm.email, registerForm.password, {
      nom: registerForm.nom,
      prenom: registerForm.prenom,
      telephone: registerForm.telephone,
    });

    if (error) {
      setError(error.message || "Erreur lors de l'inscription.");
    } else {
      setSuccess(
        `Un email de confirmation a été envoyé à ${registerForm.email}. Cliquez sur le lien pour activer votre compte.`
      );
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!loginForm.email || !loginForm.password) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      setSuccess("Connexion réussie !");
      setTimeout(() => {
        setShowAuthModal(false);
        setSuccess(null);
      }, 1000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowAuthModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="pt-8 px-8 pb-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === "register" ? "Créer un compte" : "Se connecter"}
          </h2>
          <p className="text-sm text-gray-500">
            {activeTab === "register"
              ? "Inscrivez-vous pour ajouter des produits au panier"
              : "Connectez-vous à votre compte"}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="px-8 pb-4 space-y-3">
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all disabled:opacity-50"
          >
            {socialLoading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
            Continuer avec Google
          </button>
          <button
            onClick={() => handleSocialLogin("facebook")}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium text-sm transition-all disabled:opacity-50"
          >
            {socialLoading === "facebook" ? <Loader2 className="w-5 h-5 animate-spin" /> : <FacebookIcon />}
            Continuer avec Facebook
          </button>
          <button
            onClick={() => handleSocialLogin("apple")}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-black hover:bg-gray-900 text-white font-medium text-sm transition-all disabled:opacity-50"
          >
            {socialLoading === "apple" ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
            Continuer avec Apple
          </button>
          <button
            onClick={() => handleSocialLogin("azure")}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-all disabled:opacity-50"
          >
            {socialLoading === "azure" ? <Loader2 className="w-5 h-5 animate-spin" /> : <MicrosoftIcon />}
            Continuer avec Microsoft
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4 px-8 py-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-medium text-gray-400 uppercase">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tabs */}
        <div className="flex mx-8 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setActiveTab("register"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "register"
                ? "bg-white text-[#4A90D9] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Créer un compte
          </button>
          <button
            onClick={() => { setActiveTab("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === "login"
                ? "bg-white text-[#4A90D9] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Se connecter
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mx-8 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Forms */}
        <div className="px-8 pb-8">
          {activeTab === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Dupont"
                      value={registerForm.nom}
                      onChange={(e) => setRegisterForm({ ...registerForm, nom: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Jean"
                      value={registerForm.prenom}
                      onChange={(e) => setRegisterForm({ ...registerForm, prenom: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="0696 12 34 56"
                    value={registerForm.telephone}
                    onChange={(e) => setRegisterForm({ ...registerForm, telephone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
