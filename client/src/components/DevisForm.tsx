import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, FileText, Download } from "lucide-react";
import { formatEur, calculerPrix } from "@/utils/calculPrix";
import { generateDevisPDF, type DevisData } from "@/utils/generateDevisPDF";

interface PartnerOption {
  id: string;
  nom: string;
  code: string;
}

export interface DevisProduit {
  id: string;
  nom: string;
  quantite?: number;
  prixAffiche?: number;
  prixUnitaire?: number;
  prixAchat?: number;    // prix d'achat brut (pour calculer prixPublic ×2)
  prixPublic?: number;   // prix référence ×2 (pour barré VIP)
}

interface DevisFormProps {
  produits: DevisProduit[];
  prixTotalCalcule?: number;
  onSuccess?: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function getNextDevisNum(): Promise<string> {
  if (!supabase) {
    const year = new Date().getFullYear().toString().slice(-2);
    return `D${year}00001`;
  }
  // Utilise la séquence SQL serveur pour éviter tout doublon concurrent
  const { data, error } = await supabase.rpc("get_next_devis_numero");
  if (error || !data) {
    // Fallback basé sur timestamp si la fonction SQL n'existe pas encore
    const ts = Date.now().toString().slice(-6);
    const year = new Date().getFullYear().toString().slice(-2);
    return `D${year}${ts}`;
  }
  return data as string;
}

export default function DevisForm({ produits, prixTotalCalcule, onSuccess }: DevisFormProps) {
  const { user, profile, role } = useAuth();

  // Pré-remplir depuis le profil : informations personnelles + adresse facturation si disponible
  const [form, setForm] = useState({
    nom: profile
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : (user?.user_metadata?.full_name as string) ?? "",
    email: profile?.email ?? user?.email ?? "",
    telephone: profile?.phone ?? (user?.user_metadata?.phone as string) ?? "",
    adresse: profile?.adresse_facturation ?? "",
    ville: profile?.adresse_facturation
      ? `${profile.cp_facturation ?? ""} ${profile.ville_facturation ?? ""}`.trim()
      : "",
    pays: profile?.pays_facturation ?? "France",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [numeroDevis, setNumeroDevis] = useState("");
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedPartnerCode, setSelectedPartnerCode] = useState<string>("");

  // Charger les partenaires actifs pour la sélection (rôle partner ou admin/collaborateur)
  useEffect(() => {
    if (!supabase) return;
    if (role !== "partner" && role !== "admin" && role !== "collaborateur") return;
    supabase
      .from("partners")
      .select("id, nom, code")
      .eq("actif", true)
      .order("nom")
      .then(({ data }) => {
        const list = (data as PartnerOption[]) ?? [];
        setPartners(list);
        // Auto-sélectionner si l'utilisateur est partner et lié à un seul partenaire
        if (role === "partner" && list.length === 1) {
          setSelectedPartnerId(list[0].id);
          setSelectedPartnerCode(list[0].code);
        }
      });
  }, [role]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email) {
      setError("Nom et email sont obligatoires.");
      return;
    }
    if (!form.adresse || !form.ville) {
      setError("Adresse et ville sont obligatoires pour générer le devis.");
      return;
    }
    if (!form.telephone) {
      setError("Le téléphone est obligatoire.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      let numero = await getNextDevisNum();
      // Appender le code partenaire au numéro de devis si sélectionné
      if (selectedPartnerCode) {
        numero = `${numero}-${selectedPartnerCode}`;
      }
      setNumeroDevis(numero);

      const today = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });

      // Construire les lignes de produits pour le PDF
      const lignes: DevisData["produits"] = produits.map((p) => {
        const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
        const qty = p.quantite ?? 1;
        // Prix référence ×2 pour affichage barré VIP
        // Prix public ×2 via calculerPrix (source unique)
        const prixPublic = p.prixPublic ?? (p.prixAchat
          ? calculerPrix(p.prixAchat, "user").prixAffiche ?? undefined
          : undefined);
        const remise = prixPublic && prixPublic > pu
          ? Math.round((1 - pu / prixPublic) * 100)
          : undefined;
        return {
          nom: p.nom,
          prixUnitaire: pu,
          prixPublic,
          remise,
          quantite: qty,
          total: Math.round(pu * qty),
        };
      });

      // Total = somme exacte des lignes (jamais prixTotalCalcule séparé)
      const totalHT = lignes.reduce((s, l) => s + l.total, 0);

      const devisData: DevisData = {
        numeroDevis: numero,
        date: today,
        client: {
          nom: form.nom,
          adresse: form.adresse,
          ville: form.ville,
          pays: form.pays,
          email: form.email,
          telephone: form.telephone || undefined,
        },
        produits: lignes,
        totalHT,
        role: role ?? "user",
      };

      // Générer PDF
      const blob = generateDevisPDF(devisData);

      // Sauvegarder dans Supabase
      if (supabase) {
        const payload = {
          user_id: user?.id ?? null,
          email: form.email,
          nom: form.nom,
          telephone: form.telephone || null,
          message: form.message || null,
          produits: produits,
          prix_total_calcule: totalHT,
          role_client: role,
          statut: "nouveau",
          numero_devis: numero,
          adresse_client: form.adresse,
          ville_client: form.ville,
          pays_client: form.pays,
          partner_id: selectedPartnerId || null,
        };
        const { error: dbErr } = await supabase.from("quotes").insert(payload);
        if (dbErr) throw new Error(dbErr.message);

        // Sauvegarder téléphone si manquant
        if (user?.id && profile && !profile.phone && form.telephone) {
          await supabase.from("profiles").update({ phone: form.telephone }).eq("id", user.id);
        }
        // Sauvegarder adresse facturation si non encore renseignée dans le profil
        if (user?.id && profile && !profile.adresse_facturation && form.adresse) {
          const villeParts = form.ville.trim().split(/\s+/);
          const cp = villeParts.length > 1 && /^\d{5}/.test(villeParts[0]) ? villeParts[0] : "";
          const villeOnly = cp ? villeParts.slice(1).join(" ") : form.ville;
          await supabase.from("profiles").update({
            adresse_facturation: form.adresse,
            ville_facturation: villeOnly,
            cp_facturation: cp,
            pays_facturation: form.pays,
          }).eq("id", user.id);
        }
      }

      // Télécharger le PDF
      downloadBlob(blob, `Devis_${numero}.pdf`);

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
        <h3 className="text-xl font-bold text-gray-800 mb-2">Devis généré !</h3>
        <p className="text-gray-600 mb-1">
          Votre devis <span className="font-bold text-[#4A90D9]">{numeroDevis}</span> a été téléchargé.
        </p>
        <p className="text-gray-500 text-sm">
          Il est aussi disponible dans votre espace client sous "Mes devis".
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
                <span>{p.nom}{p.quantite && p.quantite > 1 ? ` ×${p.quantite}` : ""}</span>
                {p.prixAffiche != null && (
                  <span className="font-semibold text-[#4A90D9]">
                    {formatEur(p.prixAffiche)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {prixTotalCalcule != null && (
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
              <span>Total HT</span>
              <span className="text-[#4A90D9]">{formatEur(prixTotalCalcule)}</span>
            </div>
          )}
        </div>
      )}

      {/* Nom + Email */}
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

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={form.telephone}
          onChange={set("telephone")}
          required
          placeholder="+596 696 00 00 00"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
        />
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.adresse}
          onChange={set("adresse")}
          required
          placeholder="12 rue des Fleurs"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
        />
      </div>

      {/* Ville + Pays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville / Code postal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.ville}
            onChange={set("ville")}
            required
            placeholder="97200 Fort-de-France"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
          <select
            value={form.pays}
            onChange={set("pays")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] bg-white"
          >
            <option>France</option>
            <option>Martinique</option>
            <option>Guadeloupe</option>
            <option>Guyane</option>
            <option>La Réunion</option>
            <option>Mayotte</option>
            <option>Nouvelle-Calédonie</option>
            <option>Polynésie française</option>
            <option>Saint-Martin</option>
            <option>Saint-Barthélemy</option>
            <option>Belgique</option>
            <option>Suisse</option>
            <option>Canada</option>
            <option>Autre</option>
          </select>
        </div>
      </div>

      {/* Message */}
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

      {/* Sélection du partenaire (visible pour partner, admin, collaborateur) */}
      {partners.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Partenaire apporteur d'affaire
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setSelectedPartnerId(null); setSelectedPartnerCode(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedPartnerId
                  ? "bg-[#4A90D9] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Direct (aucun)
            </button>
            {partners.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPartnerId(p.id); setSelectedPartnerCode(p.code); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPartnerId === p.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="font-mono mr-1">{p.code}</span> {p.nom}
              </button>
            ))}
          </div>
          {selectedPartnerCode && (
            <p className="text-xs text-gray-400 mt-1">
              Le devis sera numéroté avec le suffixe -{selectedPartnerCode}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold"
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Génération du devis…</>
        ) : (
          <><FileText className="h-5 w-5 mr-2" /><Download className="h-4 w-4 mr-1" /> Générer et télécharger mon devis</>
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Le devis sera téléchargé immédiatement et enregistré dans votre espace client.
      </p>
    </form>
  );
}
