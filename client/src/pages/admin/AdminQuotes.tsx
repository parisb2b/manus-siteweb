import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Save, Crown, Download, Receipt, Handshake, CheckCircle2, Ship, FileCheck, Truck } from "lucide-react";
// PDF via moteur mutualisé features/pdf
import { generateDevisPDF, type DevisData } from "@/features/pdf/templates/quote-pdf";
import { generateFacturePDF, type FactureData } from "@/features/pdf/templates/invoice-pdf";
import { generateCommissionPDF, type CommissionData } from "@/features/pdf/templates/commission-pdf";
import { generateFeesPDF, type FeesData } from "@/features/pdf/templates/fees-pdf";
import { generateDeliveryNotePDF, type DeliveryNoteData } from "@/features/pdf/templates/delivery-note-pdf";
import { generateSuiviAchatsExcel, type SuiviAchatRow } from "@/features/excel/suivi-achats";
import { sendDocumentNotification } from "@/lib/notifications";
// Calcul commission depuis source unique features/pricing
import { prixPartenaire as calcPrixPartenaire } from "@/features/pricing/model/pricing";

const ADMIN_PARTNER_ID = "00000000-0000-0000-0000-000000000001";

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

interface Partner {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
}

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
  // partenaire / commission
  partner_id?: string;
  commission_montant?: number;
  commission_payee?: boolean;
  commission_pdf_url?: string;
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
      nom: q.nom, adresse: q.adresse_client || "",
      ville: q.ville_client || "", pays: q.pays_client || "France",
      email: q.email, telephone: q.telephone,
    },
    produits: lignes,
    totalHT: q.prix_negocie ?? q.prix_total_calcule ?? 0,
    role: q.role_client ?? "user",
  };
}

function buildFactureData(q: Quote): FactureData {
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const dateDevis = new Date(q.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const lignes = (q.produits || []).map((p: any) => ({
    nom: p.nom || p.name || p.id,
    prixUnitaire: p.prixAffiche ?? p.prixUnitaire ?? 0,
    quantite: p.quantite ?? 1,
    total: (p.prixAffiche ?? 0) * (p.quantite ?? 1),
  }));
  const factureNum = (q.numero_devis || `D${q.id.slice(0, 5)}`).replace("D", "F");
  return {
    numeroFacture: factureNum, dateFacture: today,
    numeroDevis: q.numero_devis, dateDevis,
    client: {
      nom: q.nom, adresse: q.adresse_client || "",
      ville: q.ville_client || "", pays: q.pays_client || "France",
      email: q.email, telephone: q.telephone,
    },
    produits: lignes,
    totalHT: q.prix_negocie ?? q.prix_total_calcule ?? 0,
  };
}

// Commission = prix_negocie - prix_partenaire (prix_achat × 1.2)
// prix_achat ≈ prix_total_calcule / 2 (public price user ×2)
// Utilise calcPrixPartenaire() depuis features/pricing — source unique du multiplicateur ×1.2
function calcCommission(q: Quote): { prixPartenaire: number; commission: number } {
  const prixNegocie = q.prix_negocie ?? q.prix_total_calcule ?? 0;
  const prixPublic = q.prix_total_calcule ?? 0;
  const prixAchat = prixPublic > 0 ? prixPublic / 2 : prixNegocie / 1.3;
  const prixPartenaireVal = calcPrixPartenaire(prixAchat);
  const commission = Math.max(0, Math.round(prixNegocie - prixPartenaireVal));
  return { prixPartenaire: prixPartenaireVal, commission };
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<Statut | "tous">("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<Quote>>>({});
  const [vipMsg, setVipMsg] = useState<Record<string, string>>({});

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const q = supabase.from("quotes").select("*").order("created_at", { ascending: false });
    if (filterStatut !== "tous") q.eq("statut", filterStatut);
    const [{ data }, { data: pList }] = await Promise.all([
      q,
      supabase.from("partners").select("id, nom, email, telephone").eq("actif", true).order("nom"),
    ]);
    setQuotes((data as Quote[]) ?? []);
    setPartners((pList as Partner[]) ?? []);
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

  // Passer en VIP : attribuer partenaire (défaut ADMINISTRATEUR) + calculer commission
  const passerEnVip = async (q: Quote) => {
    if (!supabase) return;
    setSaving(q.id);
    const ed = editData[q.id] ?? {};
    const partnerId = ed.partner_id ?? q.partner_id ?? ADMIN_PARTNER_ID;
    const { prixPartenaire, commission } = calcCommission(q);
    const partner = partners.find((p) => p.id === partnerId);

    // Mettre à jour profil + devis
    await Promise.all([
      supabase.from("profiles").update({ role: "vip" }).eq("email", q.email),
      supabase.from("quotes").update({
        role_client: "vip",
        partner_id: partnerId,
        commission_montant: commission,
        statut: "accepte",
      }).eq("id", q.id),
    ]);

    const msg = `✓ Client passé en VIP — attribué à "${partner?.nom ?? "ADMINISTRATEUR"}" — Commission : ${formatEur(commission)}`;
    setVipMsg((prev) => ({ ...prev, [q.id]: msg }));
    setTimeout(() => setVipMsg((prev) => { const n = { ...prev }; delete n[q.id]; return n; }), 5000);
    setSaving(null);
    await load();
  };

  const genererFacture = async (q: Quote, typeFacture: "standard" | "acompte" | "solde" = "standard") => {
    if (!supabase) return;
    setSaving(q.id);

    // Obtenir numéro de facture séquentiel
    let factureNum: string;
    const { data: numData } = await supabase.rpc("get_next_facture_numero");
    factureNum = numData ?? `FA${Date.now().toString().slice(-6)}`;

    const totalHT = q.prix_negocie ?? q.prix_total_calcule ?? 0;
    const acomptePct = 30; // 30% par défaut
    let montant = totalHT;
    let subtitle = "";

    if (typeFacture === "acompte") {
      montant = Math.round(totalHT * acomptePct / 100);
      subtitle = `Acompte ${acomptePct}% sur devis ${q.numero_devis || ""}`;
    } else if (typeFacture === "solde") {
      // Chercher les acomptes déjà émis pour ce devis
      const { data: existingInv } = await supabase
        .from("invoices")
        .select("montant_ht")
        .eq("quote_id", q.id)
        .eq("type_facture", "acompte");
      const totalAcomptes = (existingInv || []).reduce((s: number, inv: any) => s + (inv.montant_ht ?? 0), 0);
      montant = Math.max(0, totalHT - totalAcomptes);
      subtitle = `Solde sur devis ${q.numero_devis || ""} (acomptes déduits : ${formatEur(totalAcomptes)})`;
    }

    const factureData = buildFactureData(q);
    factureData.numeroFacture = factureNum;
    factureData.totalHT = montant;

    const blob = generateFacturePDF(factureData);

    // Enregistrer dans table invoices
    await supabase.from("invoices").insert({
      numero_facture: factureNum,
      quote_id: q.id,
      user_id: null, // sera rempli si on a le user_id
      montant_ht: montant,
      montant_acompte: typeFacture === "acompte" ? montant : 0,
      type_facture: typeFacture,
      statut: "emise",
    });

    await supabase.from("quotes").update({ facture_generee: true }).eq("id", q.id);
    downloadBlob(blob, `Facture_${factureNum}.pdf`);
    setSaving(null);
    await load();
  };

  const genererCommission = async (q: Quote) => {
    if (!supabase) return;
    setSaving("comm_" + q.id);
    const partner = partners.find((p) => p.id === (q.partner_id ?? ADMIN_PARTNER_ID));
    const { prixPartenaire, commission } = calcCommission(q);
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const commNum = "C" + (q.numero_devis || q.id.slice(0, 6)).replace(/^D/, "");
    const nomsProduits = (q.produits || []).map((p: any) => p.nom || p.name || p.id).join(", ");
    const commData: CommissionData = {
      numeroCommission: commNum,
      date: today,
      partenaire: {
        nom: partner?.nom ?? "ADMINISTRATEUR",
        email: partner?.email ?? "parisb2b@gmail.com",
        telephone: partner?.telephone,
      },
      devis: {
        numeroDevis: q.numero_devis || q.id.slice(0, 8),
        nomClient: q.nom,
        produits: nomsProduits,
        prixNegocie: q.prix_negocie ?? q.prix_total_calcule ?? 0,
        prixPartenaire,
        commission,
      },
    };
    const blob = generateCommissionPDF(commData);
    downloadBlob(blob, `Commission_${commNum}.pdf`);
    setSaving(null);
  };

  const genererFrais = async (q: Quote, typeFrais: "maritime" | "dedouanement") => {
    setSaving("frais_" + q.id);
    const prefix = typeFrais === "maritime" ? "FM" : "DD";
    const num = `${prefix}${(q.numero_devis || q.id.slice(0, 6)).replace(/^D/, "")}`;
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const feesData: FeesData = {
      numeroDocument: num,
      date: today,
      type: typeFrais,
      client: {
        nom: q.nom,
        adresse: q.adresse_client,
        ville: q.ville_client,
        pays: q.pays_client,
        email: q.email,
        telephone: q.telephone,
      },
      referenceDevis: q.numero_devis,
      lignes: [{ designation: typeFrais === "maritime" ? "Frais de transport maritime" : "Frais de d\u00E9douanement", montant: 0 }],
      totalHT: 0,
    };
    const blob = generateFeesPDF(feesData);
    downloadBlob(blob, `${prefix}_${num}.pdf`);
    setSaving(null);
  };

  const genererBL = async (q: Quote) => {
    setSaving("bl_" + q.id);
    const blNum = `BL${(q.numero_devis || q.id.slice(0, 6)).replace(/^D/, "")}`;
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const produits = (q.produits || []).map((p: any) => ({
      designation: p.nom || p.name || p.id,
      reference: p.reference || "",
      quantite: p.quantite ?? 1,
      observations: "",
    }));
    const blData: DeliveryNoteData = {
      numeroBL: blNum,
      date: today,
      referenceDevis: q.numero_devis,
      client: {
        nom: q.nom,
        adresse: q.adresse_client,
        ville: q.ville_client,
        pays: q.pays_client,
        email: q.email,
        telephone: q.telephone,
      },
      produits,
    };
    const blob = generateDeliveryNotePDF(blData);
    downloadBlob(blob, `BL_${blNum}.pdf`);
    setSaving(null);
  };

  const envoyerDocument = async (q: Quote, typeDoc: string, numDoc: string) => {
    setSaving("email_" + q.id);
    const ok = await sendDocumentNotification({
      email: q.email,
      nomClient: q.nom,
      typeDocument: typeDoc,
      numeroDocument: numDoc,
    });
    setSaving(null);
    if (ok) {
      setVipMsg((prev) => ({ ...prev, [q.id]: `\u2709 ${typeDoc} ${numDoc} envoy\u00E9 \u00E0 ${q.email}` }));
    } else {
      setVipMsg((prev) => ({ ...prev, [q.id]: `\u26A0 Envoi non disponible (configurer Edge Function "send-email")` }));
    }
    setTimeout(() => setVipMsg((prev) => { const n = { ...prev }; delete n[q.id]; return n; }), 5000);
  };

  const marquerCommissionPayee = async (q: Quote) => {
    if (!supabase) return;
    setSaving("pay_" + q.id);
    await supabase.from("quotes").update({ commission_payee: true }).eq("id", q.id);
    setSaving(null);
    await load();
  };

  const exporterSuiviAchats = () => {
    const rows: SuiviAchatRow[] = [];
    for (const q of quotes) {
      const produits = q.produits || [];
      const { prixPartenaire, commission } = calcCommission(q);
      const partner = partners.find((p) => p.id === (q.partner_id ?? ADMIN_PARTNER_ID));
      for (const p of produits) {
        const prixVente = p.prixAffiche ?? p.prixUnitaire ?? 0;
        const prixAchat = p.prixAchat ?? Math.round(prixVente / 2);
        rows.push({
          numeroDevis: q.numero_devis || q.id.slice(0, 8),
          dateDevis: new Date(q.created_at).toLocaleDateString("fr-FR"),
          client: q.nom,
          emailClient: q.email,
          produit: p.nom || p.name || p.id,
          reference: p.reference || "",
          quantite: p.quantite ?? 1,
          prixAchat,
          prixVente,
          marge: prixVente - prixAchat,
          partenaire: partner?.nom,
          commission: q.commission_montant ?? commission,
          statutDevis: q.statut,
          factureGeneree: q.facture_generee ?? false,
          acomptePaye: false,
          soldePaye: false,
          notes: q.notes_admin || "",
        });
      }
    }
    const blob = generateSuiviAchatsExcel(rows);
    downloadBlob(blob, `Suivi_Achats_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const patch = (id: string, field: string, val: any) => {
    setEditData((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: val } }));
  };
  const getEdit = (id: string) => editData[id] ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Devis</h2>
        <div className="flex gap-2">
          <button
            onClick={exporterSuiviAchats}
            className="flex items-center gap-2 text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" /> Export Excel
          </button>
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4A90D9]">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {(["tous", "nouveau", "en_cours", "negociation", "accepte", "refuse"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatut === s ? "bg-[#4A90D9] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "tous" ? "Tous" : STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" /></div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun devis trouvé</div>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const ed = getEdit(q.id);
            const isOpen = expandedId === q.id;
            const statut = (ed.statut ?? q.statut) as Statut;
            const { prixPartenaire, commission } = calcCommission(q);
            const selectedPartnerId = ed.partner_id ?? q.partner_id ?? ADMIN_PARTNER_ID;
            const selectedPartner = partners.find((p) => p.id === selectedPartnerId);
            const isNotAdmin = selectedPartnerId !== ADMIN_PARTNER_ID;

            return (
              <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header ligne */}
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
                        {q.numero_devis && <span className="ml-2 text-xs font-normal text-gray-400">#{q.numero_devis}</span>}
                        {q.role_client === "vip" && <span className="ml-2 text-xs font-bold text-purple-600">VIP</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {q.email} — {new Date(q.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {q.facture_generee && <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Facturé</span>}
                    {q.commission_payee && <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">Comm. payée ✓</span>}
                    {(q.prix_negocie ?? q.prix_total_calcule) != null && (
                      <span className="text-sm font-bold text-[#4A90D9]">
                        {formatEur(q.prix_negocie ?? q.prix_total_calcule ?? 0)}
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {/* VIP flash msg */}
                {vipMsg[q.id] && (
                  <div className="mx-5 mb-2 flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg px-4 py-2.5">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {vipMsg[q.id]}
                  </div>
                )}

                {/* Détail dépliable */}
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
                      {/* Produits */}
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
                        {/* PDF devis / factures */}
                        <div className="flex gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => downloadBlob(generateDevisPDF(buildDevisData(q)), `Devis_${q.numero_devis || q.id.slice(0,8)}.pdf`)}
                            className="flex items-center gap-1.5 text-xs text-[#4A90D9] font-medium border border-[#4A90D9] rounded-lg px-3 py-1.5 hover:bg-[#4A90D9]/10"
                          >
                            <Download className="h-3.5 w-3.5" /> Devis PDF
                          </button>
                          <button
                            onClick={() => genererFacture(q, "standard")}
                            disabled={saving === q.id}
                            className="flex items-center gap-1.5 text-xs text-white bg-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Receipt className="h-3.5 w-3.5" /> Facture totale
                          </button>
                          <button
                            onClick={() => genererFacture(q, "acompte")}
                            disabled={saving === q.id}
                            className="flex items-center gap-1.5 text-xs text-white bg-amber-500 rounded-lg px-3 py-1.5 hover:bg-amber-600 disabled:opacity-50"
                          >
                            <Receipt className="h-3.5 w-3.5" /> Acompte 30%
                          </button>
                          <button
                            onClick={() => genererFacture(q, "solde")}
                            disabled={saving === q.id}
                            className="flex items-center gap-1.5 text-xs text-white bg-teal-600 rounded-lg px-3 py-1.5 hover:bg-teal-700 disabled:opacity-50"
                          >
                            <Receipt className="h-3.5 w-3.5" /> Facture solde
                          </button>
                          <button
                            onClick={() => genererFrais(q, "maritime")}
                            disabled={saving === "frais_" + q.id}
                            className="flex items-center gap-1.5 text-xs text-white bg-cyan-600 rounded-lg px-3 py-1.5 hover:bg-cyan-700 disabled:opacity-50"
                          >
                            <Ship className="h-3.5 w-3.5" /> Frais maritimes
                          </button>
                          <button
                            onClick={() => genererFrais(q, "dedouanement")}
                            disabled={saving === "frais_" + q.id}
                            className="flex items-center gap-1.5 text-xs text-white bg-violet-600 rounded-lg px-3 py-1.5 hover:bg-violet-700 disabled:opacity-50"
                          >
                            <FileCheck className="h-3.5 w-3.5" /> D\u00E9douanement
                          </button>
                          <button
                            onClick={() => genererBL(q)}
                            disabled={saving === "bl_" + q.id}
                            className="flex items-center gap-1.5 text-xs text-white bg-green-600 rounded-lg px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
                          >
                            <Truck className="h-3.5 w-3.5" /> Bon de livraison
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Section Partenaire & Commission ─────────────────── */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                        <Handshake className="h-3.5 w-3.5" /> Partenaire & Commission
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Dropdown partenaire */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Attribuer à un partenaire</label>
                          <select
                            value={selectedPartnerId}
                            onChange={(e) => patch(q.id, "partner_id", e.target.value)}
                            className="w-full border border-orange-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                          >
                            {partners.map((p) => (
                              <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                          </select>
                        </div>
                        {/* Commission calculée */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Commission calculée</label>
                          <div className="bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-sm">
                            <span className="font-bold text-orange-600">{formatEur(commission)}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              (prix négocié − prix partenaire {formatEur(prixPartenaire)})
                            </span>
                          </div>
                        </div>
                        {/* Statut paiement */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Statut commission</label>
                          {q.commission_payee ? (
                            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg px-3 py-1.5">
                              <CheckCircle2 className="h-4 w-4" /> Payée ✓
                            </div>
                          ) : (
                            <button
                              onClick={() => marquerCommissionPayee(q)}
                              disabled={saving === "pay_" + q.id}
                              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50"
                            >
                              {saving === "pay_" + q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Marquer payée
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Bouton note de commission (hors ADMINISTRATEUR) */}
                      {isNotAdmin && (
                        <button
                          onClick={() => genererCommission(q)}
                          disabled={saving === "comm_" + q.id}
                          className="flex items-center gap-1.5 text-xs text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-3 py-1.5 disabled:opacity-50"
                        >
                          {saving === "comm_" + q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          Générer note de commission PDF → {selectedPartner?.nom}
                        </button>
                      )}
                    </div>

                    {/* ── Actions admin ─────────────────────────────────── */}
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
                            onClick={() => passerEnVip(q)}
                            disabled={saving === q.id}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                          >
                            <Crown className="h-4 w-4" /> Passer en VIP
                          </button>
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
