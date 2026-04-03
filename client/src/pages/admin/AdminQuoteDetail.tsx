import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, FileText, Download, CheckCircle2, XCircle,
  Mail, Plus, Loader2, AlertCircle, ArrowUpCircle, Save
} from "lucide-react";
import { adminQuery, adminUpdate } from "@/lib/adminQuery";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatEur } from "@/utils/calculPrix";
import {
  getProduitsList, getAcompteList,
  getAcompteMontant, getAcompteStatut
} from "@/lib/quoteHelpers";

// ── Type — colonnes réelles de la table quotes ─────────────
interface QuoteDetail {
  id: string;
  numero_devis: string;
  nom: string;
  email: string;
  telephone?: string;
  message?: string;
  produits?: any;              // JSON array
  prix_total_calcule?: number;
  prix_negocie?: number;
  role_client?: string;
  statut: string;
  notes_admin?: string;
  adresse_client?: string;
  ville_client?: string;
  pays_client?: string;
  partenaire_code?: string;
  partenaire_id?: string;
  partner_id?: string;
  acomptes?: any;              // JSON array
  total_encaisse?: number;
  solde_restant?: number;
  facture_url?: string;
  pdf_url?: string;
  invoice_number?: string;
  commission_montant?: number;
  commission_payee?: boolean;
  commission_pdf_url?: string;
  signature_client?: string;
  signe_le?: string;
  facture_generee?: boolean;
  created_at: string;
  updated_at?: string;
}

interface PartnerOption {
  id: string;
  nom: string;
}

export default function AdminQuoteDetail() {
  // ⚠️ useParams ne fonctionne pas ici car le composant est rendu
  // directement par AdminLayout, pas via <Route path="/admin/devis/:id">
  // → On extrait l'id depuis l'URL
  const [location, setLocation] = useLocation();
  const id = location.match(/\/admin\/devis\/([a-f0-9-]+)/i)?.[1] || null;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newAcompteMontant, setNewAcompteMontant] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Client profile (role badge + VIP upgrade)
  const [clientRole, setClientRole] = useState<string | null>(null);

  // Partners dropdown
  const [partners, setPartners] = useState<PartnerOption[]>([]);

  // Notes admin éditable
  const [notesAdmin, setNotesAdmin] = useState("");
  const [notesChanged, setNotesChanged] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadQuote = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const result = await adminQuery<QuoteDetail>("quotes", {
      select: "*",
      eq: { id },
      limit: 1,
    });
    if (result.error) {
      setError(result.error);
    } else if (result.data.length === 0) {
      setError("Devis introuvable");
    } else {
      const q = result.data[0];
      setQuote(q);
      setNotesAdmin(q.notes_admin || "");
      setNotesChanged(false);

      // Charger le rôle client depuis profiles
      if (q.email) {
        const profileResult = await adminQuery<{ role: string }>("profiles", {
          select: "role",
          eq: { email: q.email },
          limit: 1,
        });
        if (profileResult.data.length > 0) {
          setClientRole(profileResult.data[0].role);
        }
      }
    }
    setLoading(false);
  };

  const loadPartners = async () => {
    const result = await adminQuery<PartnerOption>("partners", {
      select: "id, nom",
      eq: { actif: true },
      order: { column: "nom", ascending: true },
    });
    setPartners(result.data);
  };

  useEffect(() => {
    loadQuote();
    loadPartners();
  }, [id]);

  const handleUpdateStatut = async (statut: string) => {
    if (!quote) return;
    setSaving(true);
    await adminUpdate("quotes", quote.id, { statut });
    setQuote((prev) => (prev ? { ...prev, statut } : prev));
    setSaving(false);
    showToast(`Statut → ${statut}`);
  };

  const handleSaveNotes = async () => {
    if (!quote) return;
    setSaving(true);
    const { error } = await adminUpdate("quotes", quote.id, { notes_admin: notesAdmin });
    if (!error) {
      setQuote((prev) => (prev ? { ...prev, notes_admin: notesAdmin } : prev));
      setNotesChanged(false);
      showToast("Notes sauvegardées");
    }
    setSaving(false);
  };

  const handleChangePartner = async (partnerId: string) => {
    if (!quote) return;
    setSaving(true);
    const updates: Record<string, any> = {
      partenaire_id: partnerId || null,
      partner_id: partnerId || null,
    };
    // Trouver le nom du partenaire pour partenaire_code
    const partner = partners.find((p) => p.id === partnerId);
    updates.partenaire_code = partner?.nom || null;

    await adminUpdate("quotes", quote.id, updates);
    setQuote((prev) =>
      prev
        ? { ...prev, partenaire_id: partnerId || undefined, partner_id: partnerId || undefined, partenaire_code: partner?.nom || undefined }
        : prev
    );
    setSaving(false);
    showToast(partnerId ? `Partenaire : ${partner?.nom}` : "Partenaire retiré");
  };

  const handleUpgradeVIP = async () => {
    if (!quote?.email) return;
    setSaving(true);
    // Trouver le profile par email et mettre à jour
    const profileResult = await adminQuery<{ id: string }>("profiles", {
      select: "id",
      eq: { email: quote.email },
      limit: 1,
    });
    if (profileResult.data.length > 0) {
      await adminUpdate("profiles", profileResult.data[0].id, { role: "vip" });
      setClientRole("vip");
      showToast("Client passé en VIP");
    }
    setSaving(false);
  };

  const handleEncaisserAcompte = async (index: number) => {
    if (!quote) return;
    setSaving(true);
    const list = getAcompteListParsed(quote.acomptes);
    if (list[index]) {
      list[index] = { ...list[index], statut: "encaisse", date_encaissement: new Date().toISOString() };
    }
    const totalEncaisse = list
      .filter((a: any) => a.statut === "encaisse" || a.statut === "valide")
      .reduce((s: number, a: any) => s + (a.montant || 0), 0);
    const soldeRestant = (quote.prix_total_calcule || 0) - totalEncaisse;

    await adminUpdate("quotes", quote.id, {
      acomptes: list,
      total_encaisse: totalEncaisse,
      solde_restant: soldeRestant,
    });
    setQuote((prev) =>
      prev ? { ...prev, acomptes: list, total_encaisse: totalEncaisse, solde_restant: soldeRestant } : prev
    );
    setSaving(false);
    showToast("Acompte encaissé");
  };

  const handleAddAcompte = async () => {
    if (!quote || !newAcompteMontant) return;
    const montant = parseFloat(newAcompteMontant);
    if (isNaN(montant) || montant <= 0) return;

    setSaving(true);
    const list = getAcompteListParsed(quote.acomptes);
    list.push({
      montant,
      statut: "en_attente",
      date_declaration: new Date().toISOString(),
    });
    const totalEncaisse = list
      .filter((a: any) => a.statut === "encaisse" || a.statut === "valide")
      .reduce((s: number, a: any) => s + (a.montant || 0), 0);

    await adminUpdate("quotes", quote.id, {
      acomptes: list,
      total_encaisse: totalEncaisse,
      solde_restant: (quote.prix_total_calcule || 0) - totalEncaisse,
    });
    setQuote((prev) =>
      prev ? { ...prev, acomptes: list, total_encaisse: totalEncaisse } : prev
    );
    setNewAcompteMontant("");
    setSaving(false);
    showToast(`Acompte ${formatEur(montant)} ajouté`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A90D9]" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-4">
        <button onClick={() => setLocation("/admin/devis")} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error || "Devis introuvable"}
        </div>
      </div>
    );
  }

  // Données calculées depuis les colonnes réelles
  const totalTTC = quote.prix_total_calcule || 0;
  const prixNegocie = quote.prix_negocie || null;
  const totalEncaisse = quote.total_encaisse || getAcompteMontant(quote.acomptes);
  const soldeRestant = quote.solde_restant ?? (totalTTC - totalEncaisse);
  const acompteList = getAcompteList(quote.acomptes);
  const acompteStatut = getAcompteStatut(quote.acomptes);
  const produits = getProduitsList(quote.produits);
  const partenaireRef = quote.partenaire_id || quote.partner_id || "";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLocation("/admin/devis")}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Devis & Facturation
        </button>
        <AdminBadge status={quote.statut} size="md" />
      </div>

      <h1 className="text-2xl font-bold text-gray-800">
        Devis {quote.numero_devis || "—"}
      </h1>

      {/* 3 colonnes info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Client</h3>
          <p className="font-semibold text-gray-800">{quote.nom || "—"}</p>
          <p className="text-sm text-gray-500">{quote.email}</p>
          {quote.telephone && <p className="text-sm text-gray-500">{quote.telephone}</p>}
          <p className="text-sm text-gray-500">
            {[quote.adresse_client, quote.ville_client, quote.pays_client].filter(Boolean).join(", ") || "—"}
          </p>
          {/* Rôle client depuis profiles */}
          <div className="flex items-center gap-2 pt-1">
            {clientRole && <AdminBadge status={clientRole} />}
            {clientRole === "user" && (
              <button
                onClick={handleUpgradeVIP}
                disabled={saving}
                className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50"
                title="Passer en VIP"
              >
                <ArrowUpCircle className="w-3.5 h-3.5" /> VIP
              </button>
            )}
          </div>
          {quote.signature_client && (
            <p className="text-xs text-emerald-600">
              Signé le {quote.signe_le ? new Date(quote.signe_le).toLocaleDateString("fr-FR") : "—"}
            </p>
          )}
        </div>

        {/* Devis */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Devis</h3>
          <p className="font-mono font-semibold text-[#1E3A5F]">{quote.numero_devis || "—"}</p>
          <p className="text-sm text-gray-500">
            Créé le {new Date(quote.created_at).toLocaleDateString("fr-FR")}
          </p>
          {quote.invoice_number && (
            <p className="text-sm text-gray-500">Facture : {quote.invoice_number}</p>
          )}
          {/* Partenaire dropdown */}
          <div className="pt-1">
            <label className="text-xs text-gray-400 block mb-1">Partenaire</label>
            <select
              value={partenaireRef}
              onChange={(e) => handleChangePartner(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#4A90D9] outline-none disabled:opacity-50"
            >
              <option value="">— Aucun —</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          {quote.commission_montant != null && quote.commission_montant > 0 && (
            <p className="text-xs text-gray-500">
              Commission : {formatEur(quote.commission_montant)}
              {quote.commission_payee ? " (payée)" : " (due)"}
            </p>
          )}
        </div>

        {/* Montants */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Montants</h3>
          <div className="flex justify-between text-sm font-bold">
            <span>Total</span>
            <span>{formatEur(totalTTC)}</span>
          </div>
          {prixNegocie && prixNegocie !== totalTTC && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Prix négocié</span>
              <span>{formatEur(prixNegocie)}</span>
            </div>
          )}
          {totalEncaisse > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Total encaissé</span>
              <span>-{formatEur(totalEncaisse)}</span>
            </div>
          )}
          {soldeRestant > 0 && soldeRestant < totalTTC && (
            <div className="flex justify-between text-sm font-bold text-red-600 border-t border-gray-100 pt-2">
              <span>Reste à payer</span>
              <span>{formatEur(soldeRestant)}</span>
            </div>
          )}
          {soldeRestant <= 0 && totalEncaisse > 0 && (
            <div className="flex justify-between text-sm font-bold text-emerald-600 border-t border-gray-100 pt-2">
              <span>Statut</span>
              <span>Soldé</span>
            </div>
          )}
        </div>
      </div>

      {/* Tableau produits */}
      {produits.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Produits ({produits.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 font-medium">
                <th className="px-5 py-2.5">Réf.</th>
                <th className="px-5 py-2.5">Produit</th>
                <th className="px-5 py-2.5 text-center">Qté</th>
                <th className="px-5 py-2.5 text-right">P.U.</th>
                <th className="px-5 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {produits.map((item, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-mono text-gray-500">{item.ref || "—"}</td>
                  <td className="px-5 py-3 font-medium">{item.nom}</td>
                  <td className="px-5 py-3 text-center">{item.quantite}</td>
                  <td className="px-5 py-3 text-right">{formatEur(item.prix_unitaire)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatEur(item.prix_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Message client */}
      {quote.message && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-2">Message du client</h3>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 whitespace-pre-wrap">{quote.message}</p>
        </div>
      )}

      {/* Notes admin — éditable */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Notes internes</h3>
          {notesChanged && (
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-[#4A90D9] hover:bg-[#357ABD] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Sauvegarder
            </button>
          )}
        </div>
        <textarea
          value={notesAdmin}
          onChange={(e) => {
            setNotesAdmin(e.target.value);
            setNotesChanged(e.target.value !== (quote.notes_admin || ""));
          }}
          placeholder="Notes internes (visibles uniquement par l'admin)..."
          rows={3}
          className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 placeholder-amber-400 focus:ring-2 focus:ring-amber-300 outline-none resize-y"
        />
      </div>

      {/* Suivi paiements */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Suivi des paiements</h3>

        {acompteList.length === 0 && (
          <p className="text-sm text-gray-400">Aucun paiement enregistré</p>
        )}

        {acompteList.map((ac, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <span className="font-semibold">{formatEur(ac.montant)}</span>
              <span className="text-xs text-gray-500 ml-2">
                {ac.date_declaration
                  ? new Date(ac.date_declaration).toLocaleDateString("fr-FR")
                  : ""}
              </span>
              {ac.type_paiement && (
                <span className="text-xs text-gray-400 ml-2">{ac.type_paiement}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AdminBadge status={ac.statut} />
              {(ac.statut === "en_attente" || ac.statut === "declare") && (
                <button
                  onClick={() => handleEncaisserAcompte(i)}
                  disabled={saving}
                  className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Confirmer
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Ajouter un paiement */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input
            type="number"
            placeholder="Montant €"
            value={newAcompteMontant}
            onChange={(e) => setNewAcompteMontant(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
          />
          <button
            onClick={handleAddAcompte}
            disabled={saving || !newAcompteMontant}
            className="inline-flex items-center gap-1.5 bg-[#4A90D9] hover:bg-[#357ABD] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DocCard
          title="Devis PDF"
          description={quote.pdf_url ? "Télécharger" : "Non généré"}
          icon={FileText}
          active={!!quote.pdf_url}
          href={quote.pdf_url || undefined}
        />
        <DocCard
          title="Facture acompte"
          description={acompteStatut === "encaisse" || acompteStatut === "valide" ? "Disponible" : "Après encaissement"}
          icon={Download}
          active={acompteStatut === "encaisse" || acompteStatut === "valide"}
          href={quote.facture_url || undefined}
        />
        <DocCard
          title="Facture solde"
          description={soldeRestant <= 0 && totalEncaisse > 0 ? "Soldé" : `Reste : ${formatEur(soldeRestant)}`}
          icon={Download}
          active={soldeRestant <= 0 && totalEncaisse > 0}
        />
        <DocCard
          title="Note commission"
          description={partenaireRef ? "Partenaire lié" : "Pas de partenaire"}
          icon={FileText}
          active={!!partenaireRef}
          href={quote.commission_pdf_url || undefined}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {quote.statut !== "non_conforme" && (
            <button
              onClick={() => handleUpdateStatut("non_conforme")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Marquer NC
            </button>
          )}
          <select
            value={quote.statut}
            onChange={(e) => handleUpdateStatut(e.target.value)}
            disabled={saving}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-[#4A90D9] outline-none disabled:opacity-50"
          >
            <option value="nouveau">Nouveau</option>
            <option value="en_cours">En cours</option>
            <option value="negociation">Négociation</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="non_conforme">Non conforme</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${quote.email}?subject=Devis ${quote.numero_devis || ""}`}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Mail className="w-4 h-4" /> Email client
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Helpers internes ───────────────────────────────────────
function getAcompteListParsed(acomptes: any): any[] {
  try {
    const arr = typeof acomptes === 'string' ? JSON.parse(acomptes) : acomptes;
    return Array.isArray(arr) ? [...arr] : [];
  } catch {
    return [];
  }
}

function DocCard({
  title,
  description,
  icon: Icon,
  active,
  href,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  active: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const handleClick = () => {
    if (href) {
      window.open(href, "_blank");
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={active ? handleClick : undefined}
      className={`rounded-2xl p-5 border transition-colors ${
        active
          ? "bg-white border-gray-200 hover:border-[#4A90D9] cursor-pointer shadow-sm"
          : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
      }`}
    >
      <Icon className={`w-6 h-6 mb-2 ${active ? "text-[#4A90D9]" : "text-gray-400"}`} />
      <p className="font-semibold text-sm text-gray-800">{title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}
