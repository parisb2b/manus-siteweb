import { useState } from "react";
import { Link } from "wouter";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPassword() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await resetPasswordForEmail(email.trim());

    if (error) {
      setError(error.message || "Une erreur est survenue. Veuillez réessayer.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
          <Link href="/">
            <span className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4A90D9] mb-6 cursor-pointer transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 mb-8">
            Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {sent ? (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Email envoyé !</h2>
              <p className="text-sm text-gray-600 max-w-sm">
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                Vérifiez votre boîte de réception (et vos spams).
              </p>
              <Link href="/">
                <Button className="mt-4 bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                    autoFocus
                  />
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
                  "Envoyer le lien de réinitialisation"
                )}
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
