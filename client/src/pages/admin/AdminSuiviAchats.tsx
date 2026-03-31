import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { generateSuiviAchatsExcel, type SuiviAchatRow } from "@/features/excel/suivi-achats";
import {
  Loader2, RefreshCw, Download, Filter, CheckSquare, Square, ShoppingCart,
} from "lucide-react";

interface Quote {
  id: string;
  numero_devis: string;
  created_at: string;
  nom: string;
  email: string;
  produits: any[];
  prix_total_calcule?: number;
  prix_negocie?: number;
  statut: string;
  partner_id?: string;
  commission_montant?: number;
  commission_payee?: boolean;
  // Acomptes / factures
  numero_facture?: string;
  acompte_paye?: boolean;
  montant_acompte?: number;
  solde_paye?: boolean;
  // Logistique
  frais_maritimes?: number;
  frais_dedouanement?: number;
  date_livraison_prevue?: string;
  notes?: string;
}

interface Partner {
  id: string;
  nom: string;
  code: string;
}

const STATUTS = ["nouveau", "en_cours", "negociation", "accepte", "refuse"];
const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négo",
  accepte: "Accepté",
  refuse: "Refusé",
};
const STATUT_COLORS: Record<string, string> = {
  nouveau: "bg-blue-100 text-blue-700",
  en_cours: "bg-orange-100 text-orange-700",
  negociation: "bg-purple-100 text-purple-700",
  accepte: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
};

export default function AdminSuiviAchats() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filtres
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const [qRes, pRes] = await Promise.all([
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("partners").select("id, nom, code").eq("actif", true).order("nom"),
    ]);
    setQuotes((qRes.data as Quote[]) ?? []);
    setPartners((pRes.data as Partner[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Filtrage
  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (filterStatut !== "all" && q.statut !== filterStatut) return false;
      if (filterPartner !== "all" && q.partner_id !== filterPartner) return false;
      if (filterSearch) {
        const s = filterSearch.toLowerCase();
        if (!q.nom?.toLowerCase().includes(s) && !q.numero_devis?.toLowerCase().includes(s) && !q.email?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [quotes, filterStatut, filterPartner, filterSearch]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((q) => q.id)));
    }
  };

  const getPartnerName = (id?: string) => {
    if (!id) return "";
    return partners.find((p) => p.id === id)?.nom ?? "";
  };

  // Construire les lignes Excel
  const buildRows = (quotesToExport: Quote[]): SuiviAchatRow[] => {
    const rows: SuiviAchatRow[] = [];
    for (const q of quotesToExport) {
      const prods = Array.isArray(q.produits) ? q.produits : [];
      if (prods.length === 0) {
        rows.push({
          numeroDevis: q.numero_devis || "",
          dateDevis: new Date(q.created_at).toLocaleDateString("fr-FR"),
          client: q.nom,
          emailClient: q.email,
          produit: "(aucun produit)",
          quantite: 0,
          prixAchat: 0,
          prixVente: q.prix_negocie ?? q.prix_total_calcule ?? 0,
          marge: (q.prix_negocie ?? q.prix_total_calcule ?? 0),
          partenaire: getPartnerName(q.partner_id),
          commission: q.commission_montant ?? 0,
          statutDevis: q.statut,
          factureGeneree: !!q.numero_facture,
          numeroFacture: q.numero_facture,
          acomptePaye: q.acompte_paye ?? false,
          montantAcompte: q.montant_acompte,
          soldePaye: q.solde_paye ?? false,
          fraisMaritimes: q.frais_maritimes,
          fraisDedouanement: q.frais_dedouanement,
          dateLivraisonPrevue: q.date_livraison_prevue,
          notes: q.notes,
        });
      } else {
        for (const p of prods) {
          const prixAchat = p.prixAchat ?? 0;
          const prixVente = p.prixUnitaire ?? p.prixAffiche ?? 0;
          const qty = p.quantite ?? 1;
          rows.push({
            numeroDevis: q.numero_devis || "",
            dateDevis: new Date(q.created_at).toLocaleDateString("fr-FR"),
            client: q.nom,
            emailClient: q.email,
            produit: p.nom || p.name || "",
            reference: p.reference_interne || p.reference || "",
            quantite: qty,
            prixAchat: prixAchat * qty,
            prixVente: prixVente * qty,
            marge: (prixVente - prixAchat) * qty,
            partenaire: getPartnerName(q.partner_id),
            commission: q.commission_montant ?? 0,
            statutDevis: q.statut,
            factureGeneree: !!q.numero_facture,
            numeroFacture: q.numero_facture,
            acomptePaye: q.acompte_paye ?? false,
            montantAcompte: q.montant_acompte,
            soldePaye: q.solde_paye ?? false,
            fraisMaritimes: q.frais_maritimes,
            fraisDedouanement: q.frais_dedouanement,
            dateLivraisonPrevue: q.date_livraison_prevue,
            notes: q.notes,
          });
        }
      }
    }
    return rows;
  };

  const exportExcel = () => {
    const quotesToExport = selected.size > 0
      ? filtered.filter((q) => selected.has(q.id))
      : filtered;
    if (quotesToExport.length === 0) return;

    const rows = buildRows(quotesToExport);
    const blob = generateSuiviAchatsExcel(rows);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SuiviAchats_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Totaux filtrés
  const totaux = useMemo(() => {
    let vente = 0, achat = 0, commissions = 0;
    filtered.forEach((q) => {
      vente += q.prix_negocie ?? q.prix_total_calcule ?? 0;
      commissions += q.commission_montant ?? 0;
      const prods = Array.isArray(q.produits) ? q.produits : [];
      prods.forEach((p: any) => { achat += (p.prixAchat ?? 0) * (p.quantite ?? 1); });
    });
    return { vente, achat, marge: vente - achat, commissions };
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-[#4A90D9]" /> Suivi Achats
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportExcel} disabled={filtered.length === 0}
            className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            <Download className="h-4 w-4" />
            Excel ({selected.size > 0 ? `${selected.size} sélectionnés` : `${filtered.length} devis`})
          </button>
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4A90D9]">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Devis filtrés</p>
          <p className="text-2xl font-bold text-gray-800">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">CA vente</p>
          <p className="text-2xl font-bold text-[#4A90D9]">{formatEur(totaux.vente)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Marge brute</p>
          <p className="text-2xl font-bold text-emerald-600">{formatEur(totaux.marge)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Commissions</p>
          <p className="text-2xl font-bold text-orange-500">{formatEur(totaux.commissions)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-600">Filtres</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Statut</label>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] bg-white">
              <option value="all">Tous</option>
              {STATUTS.map((s) => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Partenaire</label>
            <select value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] bg-white">
              <option value="all">Tous</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recherche</label>
            <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Client, n° devis, email…"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#4A90D9]" />
          </div>
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">Aucun devis trouvé</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#4A90D9]">
                      {selected.size === filtered.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500">N° Devis</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500">Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500">Client</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500 hidden md:table-cell">Produits</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500 hidden lg:table-cell">Partenaire</th>
                  <th className="text-right px-3 py-3 font-semibold text-[#4A90D9]">Montant</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((q) => {
                  const isSelected = selected.has(q.id);
                  const prods = Array.isArray(q.produits) ? q.produits : [];
                  return (
                    <tr key={q.id} className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50/50" : ""}`}>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(q.id)} className="text-gray-400 hover:text-[#4A90D9]">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-[#4A90D9]" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-gray-700">{q.numero_devis || q.id.slice(0, 8)}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{new Date(q.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800 text-xs">{q.nom}</div>
                        <div className="text-xs text-gray-400">{q.email}</div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-500">
                        {prods.length > 0
                          ? prods.map((p: any) => p.nom || p.name).join(", ").slice(0, 60)
                          : "—"}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-500">
                        {getPartnerName(q.partner_id) || "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#4A90D9]">
                        {formatEur(q.prix_negocie ?? q.prix_total_calcule ?? 0)}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[q.statut] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUT_LABELS[q.statut] ?? q.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
