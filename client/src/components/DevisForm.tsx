import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export interface DevisProduit {
  id: string;
  nom: string;
  quantite?: number;
  prixAffiche?: number;
}

interface DevisFormProps {
  produits: DevisProduit[];
  prixTotalCalcule?: number;
  onSuccess?: () => void;
}

export default function DevisForm({ produits, prixTotalCalcule, onSuccess }: DevisFormProps) {
  const { user, profile, role } = useAuth();

  const [form, setForm] = useState({
    nom: profile
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : (user?.user_metadata?.full_name as string) ?? "",
    email: profile?.email ?? user?.email ?? "",
    telephone: profile?.phone ?? (user?.user_metadata?.phone as string) ?? "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email) {
      setError("Nom et email sont obligatoires.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = {
        user_id: user?.id ?? null,
        email: form.email,
        nom: form.nom,
        telephone: form.telephone || null,
        message: form.message || null,
        produits: produits,
        prix_total_calcule: prixTotalCalcule ?? null,
        role_client: role,
        statut: "nouveau",
      };

      if (supabase) {
        const { error: dbErr } = await supabase.from("quotes").insert(payload);
        if (dbErr) throw new Error(dbErr.message);
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Demande envoyée !</h3>
        <p className="text-gray-600">
          Votre demande a bien été enregistrée. Nous vous recontactons sous 48h.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Récapitulatif produits */}
      {produits.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Produits demandés
          </p>
          <ul className="space-y-1">
            {produits.map((p) => (
              <li key={p.id} className="flex justify-between text-sm text-gray-700">
                <span>{p.nom}</span>
                {p.prixAffiche && (
                  <span className="font-semibold text-[#4A90D9]">
                    {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.prixAffiche)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nom}
            onChange={set("nom")}
            required
            placeholder="Jean Dupont"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            placeholder="jean@exemple.fr"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
        <input
          type="tel"
          value={form.telephone}
          onChange={set("telephone")}
          placeholder="+596 696 00 00 00"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={3}
          placeholder="Précisions sur votre projet, délai souhaité…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] resize-none"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <Send className="h-5 w-5 mr-2" />
        )}
        {loading ? "Envoi en cours…" : "Envoyer ma demande de devis"}
      </Button>
    </form>
  );
}
