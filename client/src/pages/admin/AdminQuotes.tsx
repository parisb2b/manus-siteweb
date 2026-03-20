import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Save, Crown, Download, Receipt } from "lucide-react";
import { generateDevisPDF, type DevisData } from "@/utils/generateDevisPDF";
import { generateFacturePDF, type FactureData } from "@/utils/generateFacturePDF";

type Statut = "nouveau" | "en_cours" | "negociation" | "accepte" | "refuse";

const STATUT_COLORS: Record<Statut, string> = {
  nouveau: "bg-blue-100 text-blue-700",
  en_cours: "bg-orange-100 text-orange-700",
  negociation: "bg-purple-100 text-purple-700",
  accepte: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<Statut, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négociation",
  accepte: "Accepté",
  refuse: "Refusé",
};

interface Quote {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  message?: string;
  produits: any[];
  prix_total_calcule?: number;
  prix_negocie?: number;
  role_client?: string;
  statut: Statut;
  notes_admin?: string;
  numero_devis?: string;
  facture_generee?: boolean;
  adresse_client?: string;
  ville_client?: string;
  pays_client?: string;
  created_at: string;
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

function buildDevisData(q: Quote): DevisData {
  const today = new Date(q.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const lignes = (q.produits || []).map((p: any) => ({
    nom: p.nom || p.name || p.id,
    prixUnitaire: p.prixAffiche ?? p.prixUnitaire ?? 0,
    quantite: p.quantite ?? 1,
    total: (p.prixAffiche ?? 0) * (p.quantite ?? 1),
  }));
  return {
    numeroDevis: q.numero_devis || q.id.slice(0, 8).toUpperCase(),
    date: today,
    client: {
      nom: q.nom,
      adresse: q.adresse_client || "",
      ville: q.ville_client || "",
      pays: q.pays_client || "France",
      email: q.email,
      telephone: q.telephone,
    },
    produits: lignes,
    totalHT: q.prix_negocie ?? q.prix_total_calcule ?? 0,
    role: q.role_client ?? "user",
  };
}

function buildFactureData(q: Quote): FactureData {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const dateDevis = new Date(q.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const lignes = (q.produits || []).map((p: any) => ({
    nom: p.nom || p.name || p.id,
    prixUnitaire: p.prixAffiche ?? p.prixUnitaire ?? 0,
    quantite: p.quantite ?? 1,
    total: (p.prixAffiche ?? 0) * (p.quantite ?? 1),
  }));
  const factureNum = (q.numero_devis || `D${q.id.slice(0, 5)}`).replace("D", "F");
  return {
    numeroFacture: factureNum,
    dateFacture: today,
    numeroDevis: q.numero_devis,
    dateDevis,
    client: {
      nom: q.nom,
      adresse: q.adresse_client || "",
      ville: q.ville_client || "",
      pays: q.pays_client || "France",
      email: q.email,
      telephone: q.telephone,
    },
    produits: lignes,
    totalHT: q.prix_negocie ?? q.prix_total_calcule ?? 0,
  };
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<Statut | "tous">("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<Quote>>>({});

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const q = supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (filterStatut !== "tous") q.eq("statut", filterStatut);
    const { data } = await q;
    setQuotes((data as Quote[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterStatut]);

  const save = async (quoteId: string) => {
    if (!supabase || !editData[quoteId]) return;
    setSaving(quoteId);
    await supabase.from("quotes").update(editData[quoteId]).eq("id", quoteId);
    setSaving(null);
    await load();
  };

  const passerEnVip = async (email: string, quoteId: string) => {
    if (!supabase) return;
    setSaving(quoteId);
    await supabase.from("profiles").update({ role: "vip" }).eq("email", email);
    setSaving(null);
  };

  const genererFacture = async (q: Quote) => {
    if (!supabase) return;
    setSaving(q.id);
    const factureData = buildFactureData(q);
    const blob = generateFacturePDF(factureData);
    // Marquer comme facturé dans Supabase
    await supabase.from("quotes").update({ facture_generee: true }).eq("id", q.id);
    downloadBlob(blob, `Facture_${factureData.numeroFacture}.pdf`);
    setSaving(null);
    await load();
  };

  const patch = (id: string, field: string, val: any) => {
    setEditData((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: val } }));
  };

  const getEdit = (id: string) => editData[id] ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Devis</h2>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4A90D9]">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(["tous", "nouveau", "en_cours", "negociation", "accepte", "refuse"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatut === s
                ? "bg-[#4A90D9] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "tous" ? "Tous" : STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun devis trouvé</div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const ed = getEdit(q.id);
            const isOpen = expandedId === q.id;
            const statut = (ed.statut ?? q.statut) as Statut;

            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 text-left"
                  onClick={() => setExpandedId(isOpen ? null : q.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUT_COLORS[statut]}`}>
                      {STATUT_LABELS[statut]}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {q.nom}
                        {q.numero_devis && (
                          <span className="ml-2 text-xs font-normal text-gray-400">#{q.numero_devis}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {q.email} — {new Date(q.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {q.facture_generee && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Facturé</span>
                    )}
                    {(q.prix_negocie ?? q.prix_total_calcule) != null && (
                      <span className="text-sm font-bold text-[#4A90D9]">
                        {formatEur(q.prix_negocie ?? q.prix_total_calcule ?? 0)}
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {/* Détail */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {/* Infos client */}
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <p><span className="font-medium">Téléphone :</span> {q.telephone || "—"}</p>
                        <p><span className="font-medium">Adresse :</span> {q.adresse_client || "—"}</p>
                        <p><span className="font-medium">Ville :</span> {q.ville_client || "—"}</p>
                        <p><span className="font-medium">Pays :</span> {q.pays_client || "—"}</p>
                        <p><span className="font-medium">Rôle client :</span> {q.role_client || "—"}</p>
                        {q.message && <p><span className="font-medium">Message :</span> {q.message}</p>}
                      </div>
                      {/* Produits demandés */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Produits</p>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {(q.produits || []).map((p: any, i: number) => (
                            <li key={i} className="flex justify-between">
                              <span>{p.nom || p.name || p.id}{p.quantite > 1 ? ` ×${p.quantite}` : ""}</span>
                              {p.prixAffiche && <span className="font-semibold text-[#4A90D9]">{formatEur(p.prixAffiche)}</span>}
                            </li>
                          ))}
                        </ul>
                        {/* Boutons PDF */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => downloadBlob(generateDevisPDF(buildDevisData(q)), `Devis_${q.numero_devis || q.id.slice(0,8)}.pdf`)}
                            className="flex items-center gap-1.5 text-xs text-[#4A90D9] font-medium border border-[#4A90D9] rounded-lg px-3 py-1.5 hover:bg-[#4A90D9]/10 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" /> Devis PDF
                          </button>
                          {q.facture_generee && (
                            <button
                              onClick={() => downloadBlob(generateFacturePDF(buildFactureData(q)), `Facture_${(q.numero_devis||"D00001").replace("D","F")}.pdf`)}
                              className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium border border-emerald-500 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                            >
                              <Download className="h-3.5 w-3.5" /> Facture PDF
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Édition admin */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Actions admin</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Statut */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Statut</label>
                          <select
                            value={ed.statut ?? q.statut}
                            onChange={(e) => patch(q.id, "statut", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
                          >
                            {Object.entries(STATUT_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </div>
                        {/* Prix négocié */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Prix négocié (€)</label>
                          <input
                            type="number"
                            value={ed.prix_negocie ?? q.prix_negocie ?? ""}
                            onChange={(e) => patch(q.id, "prix_negocie", e.target.value ? Number(e.target.value) : null)}
                            placeholder="Ex : 12000"
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
                          />
                        </div>
                        {/* Boutons actions */}
                        <div className="flex flex-col gap-2 items-end justify-end">
                          <button
                            onClick={() => save(q.id)}
                            disabled={saving === q.id}
                            className="w-full flex items-center justify-center gap-2 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                          >
                            {saving === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => passerEnVip(q.email, q.id)}
                            disabled={saving === q.id}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                          >
                            <Crown className="h-4 w-4" /> Passer en VIP
                          </button>
                          {!q.facture_generee && (
                            <button
                              onClick={() => genererFacture(q)}
                              disabled={saving === q.id}
                              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                            >
                              <Receipt className="h-4 w-4" /> Générer la facture
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Notes admin */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Notes admin</label>
                        <textarea
                          rows={2}
                          value={ed.notes_admin ?? q.notes_admin ?? ""}
                          onChange={(e) => patch(q.id, "notes_admin", e.target.value)}
                          placeholder="Notes internes…"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
