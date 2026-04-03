import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Save, Crown, Download, Handshake, CheckCircle2 } from "lucide-react";
// PDF via moteur mutualisé features/pdf
import { generateDevisPDF, type DevisData } from "@/features/pdf/templates/quote-pdf";
import { generateFacturePDF, type FactureData } from "@/features/pdf/templates/invoice-pdf";
import { generateCommissionPDF, type CommissionData } from "@/features/pdf/templates/commission-pdf";
import { generateFeesPDF, type FeesData } from "@/features/pdf/templates/fees-pdf";
import { generateDeliveryNotePDF, type DeliveryNoteData } from "@/features/pdf/templates/delivery-note-pdf";
import { generateSuiviAchatsExcel, type SuiviAchatRow } from "@/features/excel/suivi-achats";
import { sendDocumentNotification, sendAcompteNotification } from "@/lib/notifications";
// Calcul commission depuis source unique features/pricing
import { prixPartenaire as calcPrixPartenaire } from "@/features/pricing/model/pricing";
// Design system admin
import {
  ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton, BadgeStatut,
  SectionLabel, DocumentRow, PaiementRow, PaiementResume, AdminInput, AdminSelect,
} from "@/components/admin/AdminUI";

const ADMIN_PARTNER_ID = "00000000-0000-0000-0000-000000000001";

type Statut = "nouveau" | "en_cours" | "negociation" | "accepte" | "refuse" | "non_conforme";

const STATUT_LABELS: Record<Statut, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négociation",
  accepte: "Accepté",
  refuse: "Refusé",
  non_conforme: "Non conforme",
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
  partner_id?: string;
  commission_montant?: number;
  commission_payee?: boolean;
  commission_pdf_url?: string;
}

// ── Helpers ──────────────────────────────────

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

/** Enrichir les produits d'un devis avec prix_achat + numero_interne depuis la table products */
async function enrichProduits(produits: any[]): Promise<any[]> {
  if (!supabase || !produits || produits.length === 0) return produits;
  // Try by id first
  const productIds = produits.map((p: any) => p.id || p.product_id).filter(Boolean);
  let dbProducts: any[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase.from("products").select("id, prix_achat, numero_interne, reference_interne").in("id", productIds);
    dbProducts = data || [];
  }
  // Fallback: try by name for products without IDs
  if (dbProducts.length < produits.length) {
    const nomsManquants = produits
      .filter((p: any) => !dbProducts.find((d: any) => d.id === (p.id || p.product_id)))
      .map((p: any) => p.nom || p.name)
      .filter(Boolean);
    if (nomsManquants.length > 0) {
      const { data } = await supabase.from("products").select("nom, prix_achat, numero_interne, reference_interne").in("nom", nomsManquants);
      if (data) dbProducts.push(...data.map((d: any) => ({ ...d, id: d.nom })));
    }
  }
  return produits.map((p: any) => {
    const db = dbProducts.find((d: any) => d.id === (p.id || p.product_id) || d.nom === (p.nom || p.name));
    return {
      ...p,
      prix_achat: p.prix_achat || db?.prix_achat || null,
      numero_interne: p.numero_interne || db?.numero_interne || db?.reference_interne || undefined,
      reference_interne: p.reference_interne || db?.reference_interne || db?.numero_interne || undefined,
    };
  });
}

async function buildDevisData(q: Quote): Promise<DevisData> {
  const enriched = await enrichProduits(q.produits || []);
  const today = new Date(q.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const lignes = enriched.map((p: any) => ({
    nom: p.nom || p.name || p.id,
    prixUnitaire: p.prixAffiche ?? p.prixUnitaire ?? 0,
    prixPublic: p.prix_public ?? p.prixPublic ?? (p.prix_achat ? p.prix_achat * 2 : 0),
    prix_achat: p.prix_achat ?? undefined,
    quantite: p.quantite ?? 1,
    total: (p.prixAffiche ?? 0) * (p.quantite ?? 1),
    reference_interne: p.reference_interne || p.ref || undefined,
    numero_interne: p.numero_interne || undefined,
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
    prixNegocie: q.prix_negocie ?? null,
    prixTotalCalcule: q.prix_total_calcule ?? 0,
    role: q.role_client ?? "user",
  };
}

async function buildFactureData(q: Quote): Promise<FactureData> {
  const enriched = await enrichProduits(q.produits || []);
  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const dateDevis = new Date(q.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const lignes = enriched.map((p: any) => ({
    nom: p.nom || p.name || p.id,
    prixUnitaire: p.prixAffiche ?? p.prixUnitaire ?? 0,
    prixPublic: p.prix_public ?? p.prixPublic ?? (p.prix_achat ? p.prix_achat * 2 : 0),
    prix_achat: p.prix_achat ?? undefined,
    quantite: p.quantite ?? 1,
    total: (p.prixAffiche ?? p.prixUnitaire ?? 0) * (p.quantite ?? 1),
    reference_interne: p.reference_interne || p.ref || undefined,
    numero_interne: p.numero_interne || undefined,
  }));
  const factureNum = "FA" + (q.numero_devis || `D${q.id.slice(0, 5)}`).replace(/^D/, "");
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
    prixNegocie: q.prix_negocie ?? null,
    prixTotalCalcule: q.prix_total_calcule ?? 0,
    acomptes: (q as any).acomptes?.filter((a: any) => a.statut === "valide") || [],
  };
}

function calcCommission(q: Quote): { prixPartenaire: number; commission: number } {
  const prixNegocie = q.prix_negocie ?? q.prix_total_calcule ?? 0;
  const prixPublic = q.prix_total_calcule ?? 0;
  const prixAchat = prixPublic > 0 ? prixPublic / 2 : prixNegocie / 1.3;
  const prixPartenaireVal = calcPrixPartenaire(prixAchat);
  const commission = Math.max(0, Math.round(prixNegocie - prixPartenaireVal));
  return { prixPartenaire: prixPartenaireVal, commission };
}

// ── Composant Principal ──────────────────────

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<Statut | "tous">("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<Quote>>>({});
  const [vipMsg, setVipMsg] = useState<Record<string, string>>({});
  const [fmData, setFmData] = useState<Record<string, {libelle: string, montant: number}>>({});
  const [ddData, setDdData] = useState<Record<string, {libelle: string, montant: number}>>({});
  const [ncData, setNcData] = useState<Record<string, {prixRemise: number, prixPartenaire: number, commission: number}>>({});

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    setLoadError(null);
    try {
      const q = supabase.from("quotes").select("*").order("created_at", { ascending: false });
      if (filterStatut !== "tous") q.eq("statut", filterStatut);
      const [qRes, pRes] = await Promise.all([
        q,
        supabase.from("partners").select("id, nom, email, telephone").eq("actif", true).order("nom"),
      ]);
      if (qRes.error) throw new Error(`quotes: ${qRes.error.message}`);
      if (pRes.error) throw new Error(`partners: ${pRes.error.message}`);
      setQuotes((qRes.data as Quote[]) ?? []);
      setPartners((pRes.data as Partner[]) ?? []);
    } catch (err: any) {
      console.error("[AdminQuotes] load error:", err);
      setLoadError(err?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatut]);

  const save = async (quoteId: string) => {
    if (!supabase || !editData[quoteId]) return;
    setSaving(quoteId);
    await supabase.from("quotes").update(editData[quoteId]).eq("id", quoteId);
    setSaving(null);
    await load();
  };

  const passerEnVip = async (q: Quote) => {
    if (!supabase) return;
    setSaving(q.id);
    const ed = editData[q.id] ?? {};
    const partnerId = ed.partner_id ?? q.partner_id ?? ADMIN_PARTNER_ID;
    const { commission } = calcCommission(q);
    const partner = partners.find((p) => p.id === partnerId);
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
    let factureNum: string;
    const { data: numData } = await supabase.rpc("get_next_facture_numero");
    factureNum = numData ?? `FA${Date.now().toString().slice(-6)}`;
    const totalHT = q.prix_negocie ?? q.prix_total_calcule ?? 0;
    const acomptePct = 30;
    let montant = totalHT;
    if (typeFacture === "acompte") {
      montant = Math.round(totalHT * acomptePct / 100);
    } else if (typeFacture === "solde") {
      const { data: existingInv } = await supabase
        .from("invoices").select("montant_ht").eq("quote_id", q.id).eq("type_facture", "acompte");
      const totalAcomptes = (existingInv || []).reduce((s: number, inv: any) => s + (inv.montant_ht ?? 0), 0);
      montant = Math.max(0, totalHT - totalAcomptes);
    }
    const factureData = await buildFactureData(q);
    factureData.numeroFacture = factureNum;
    factureData.totalHT = montant;
    const blob = generateFacturePDF(factureData);
    await supabase.from("invoices").insert({
      numero_facture: factureNum, quote_id: q.id, user_id: null,
      montant_ht: montant, montant_acompte: typeFacture === "acompte" ? montant : 0,
      type_facture: typeFacture, statut: "emise",
    });
    await supabase.from("quotes").update({ facture_generee: true }).eq("id", q.id);
    downloadBlob(blob, `Facture_${factureNum}.pdf`);
    // Notification email automatique
    if (q.email && typeFacture === "acompte") {
      sendAcompteNotification({
        email: q.email, nomClient: q.nom || "Client",
        montant, numeroDevis: q.numero_devis || q.id.slice(0, 8),
      }).catch(() => {});
    }
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
      numeroCommission: commNum, date: today,
      partenaire: {
        nom: partner?.nom ?? "ADMINISTRATEUR",
        email: partner?.email ?? "parisb2b@gmail.com",
        telephone: partner?.telephone,
      },
      devis: {
        numeroDevis: q.numero_devis || q.id.slice(0, 8),
        nomClient: q.nom, produits: nomsProduits,
        prixNegocie: q.prix_negocie ?? q.prix_total_calcule ?? 0,
        prixPartenaire, commission,
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
    const dataKey = q.id;
    const inputData = typeFrais === "maritime" ? fmData[dataKey] : ddData[dataKey];
    const libelle = inputData?.libelle || (typeFrais === "maritime"
      ? "Frais de participation maritime"
      : "Frais de dédouanement, octrois de mer et autres taxes");
    const montant = inputData?.montant ?? 0;
    const feesData: FeesData = {
      numeroDocument: num, date: today, type: typeFrais,
      client: {
        nom: q.nom, adresse: q.adresse_client, ville: q.ville_client,
        pays: q.pays_client, email: q.email, telephone: q.telephone,
      },
      referenceDevis: q.numero_devis,
      lignes: [{ designation: libelle, montant }],
      totalHT: montant,
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
      numeroBL: blNum, date: today, referenceDevis: q.numero_devis,
      client: {
        nom: q.nom, adresse: q.adresse_client, ville: q.ville_client,
        pays: q.pays_client, email: q.email, telephone: q.telephone,
      },
      produits,
    };
    const blob = generateDeliveryNotePDF(blData);
    downloadBlob(blob, `BL_${blNum}.pdf`);
    setSaving(null);
  };

  const envoyerDocument = async (q: Quote, typeDoc: string, numDoc: string) => {
    setSaving("email_" + q.id);
    // 1. Tenter l'email — silencieux si échec
    try {
      await sendDocumentNotification({
        email: q.email, nomClient: q.nom,
        typeDocument: typeDoc, numeroDocument: numDoc,
      });
    } catch (err) {
      console.warn("[envoyerDocument] Email non envoyé (domaine non configuré):", err);
    }
    setSaving(null);
    // 2. Toujours afficher succès — l'email ne bloque jamais l'action
    setVipMsg((prev) => ({ ...prev, [q.id]: `✉ ${typeDoc} ${numDoc} mis à disposition ✅` }));
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
      const { commission } = calcCommission(q);
      const partner = partners.find((p) => p.id === (q.partner_id ?? ADMIN_PARTNER_ID));
      for (const p of produits) {
        const prixVente = p.prixAffiche ?? p.prixUnitaire ?? 0;
        const prixAchat = p.prixAchat ?? Math.round(prixVente / 2);
        rows.push({
          numeroDevis: q.numero_devis || q.id.slice(0, 8),
          dateDevis: new Date(q.created_at).toLocaleDateString("fr-FR"),
          client: q.nom, emailClient: q.email,
          produit: p.nom || p.name || p.id,
          reference: p.reference || "",
          quantite: p.quantite ?? 1,
          prixAchat, prixVente, marge: prixVente - prixAchat,
          partenaire: partner?.nom,
          commission: q.commission_montant ?? commission,
          statutDevis: q.statut,
          factureGeneree: q.facture_generee ?? false,
          acomptePaye: false, soldePaye: false,
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

  // ── Helper: inline doc button style ──
  const docBtnStyle = (bg: string): React.CSSProperties => ({
    borderRadius: '4px', fontSize: '9px', padding: '3px 8px', fontWeight: 500,
    border: 'none', cursor: 'pointer', color: '#fff', background: bg,
    fontFamily: ADMIN_COLORS.font,
  });

  // ── RENDU ──────────────────────────────────

  return (
    <div style={{ background: ADMIN_COLORS.pageBg, minHeight: '100vh', padding: '0', fontFamily: ADMIN_COLORS.font }}>
      {/* Header page */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0, fontFamily: ADMIN_COLORS.font }}>
            Devis & Facturation
          </h2>
          <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: '2px 0 0', fontFamily: ADMIN_COLORS.font }}>
            {quotes.length} devis — gestion complète
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <AdminButton variant="success" size="sm" onClick={exporterSuiviAchats}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Download style={{ width: 12, height: 12 }} /> Export Excel
            </span>
          </AdminButton>
          <AdminButton variant="ghost" size="sm" onClick={load}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw style={{ width: 12, height: 12 }} /> Actualiser
            </span>
          </AdminButton>
        </div>
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(["tous", "nouveau", "en_cours", "negociation", "accepte", "refuse", "non_conforme"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            style={{
              padding: '4px 12px', borderRadius: '4px',
              fontSize: '10px', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: filterStatut === s ? ADMIN_COLORS.navy : ADMIN_COLORS.grayBg,
              color: filterStatut === s ? '#fff' : ADMIN_COLORS.grayText,
              transition: 'all 0.15s',
              fontFamily: ADMIN_COLORS.font,
            }}
          >
            {s === "tous" ? "Tous" : STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite', color: ADMIN_COLORS.navyAccent }} />
        </div>
      ) : loadError ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#DC2626', fontSize: '12px', fontFamily: ADMIN_COLORS.font }}>
          ⚠ Erreur : {loadError}
          <br /><button onClick={load} style={{ marginTop: '8px', color: ADMIN_COLORS.navyAccent, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Réessayer</button>
        </div>
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: ADMIN_COLORS.grayText, fontSize: '12px', fontFamily: ADMIN_COLORS.font }}>
          Aucun devis trouvé
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {quotes.map((q, idx) => {
            const ed = getEdit(q.id);
            const isOpen = expandedId === q.id;
            const statut = (ed.statut ?? q.statut) as Statut;
            const { prixPartenaire, commission } = calcCommission(q);
            const selectedPartnerId = ed.partner_id ?? q.partner_id ?? ADMIN_PARTNER_ID;
            const selectedPartner = partners.find((p) => p.id === selectedPartnerId);
            const isNotAdmin = selectedPartnerId !== ADMIN_PARTNER_ID;
            const total = q.prix_negocie ?? q.prix_total_calcule ?? 0;
            const devisNum = q.numero_devis || q.id.slice(0, 8).toUpperCase();
            const factureNum = devisNum.replace("D", "F");
            const fmKey = q.id;
            const ddKey = q.id;
            const ncKey = q.id;
            const currentFm = fmData[fmKey] || { libelle: "Frais de participation maritime", montant: 0 };
            const currentDd = ddData[ddKey] || { libelle: "Frais de dédouanement, octrois de mer et autres taxes", montant: 0 };
            const currentNc = ncData[ncKey] || { prixRemise: q.prix_negocie ?? 0, prixPartenaire, commission };

            return (
              <div key={q.id}>
                {/* ── CLOSED ROW (when not open) ─────────────────── */}
                {!isOpen && (
                  <div
                    onClick={() => setExpandedId(q.id)}
                    style={{
                      background: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
                      borderBottom: '0.5px solid #E5E7EB',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: ADMIN_COLORS.font,
                    }}
                  >
                    {/* Left: badge + client + devis num + VIP */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BadgeStatut statut={statut} />
                      <span style={{ color: ADMIN_COLORS.navy, fontSize: '12px', fontWeight: 600, fontFamily: ADMIN_COLORS.font }}>
                        {q.nom}
                      </span>
                      <span style={{ color: ADMIN_COLORS.grayText, fontSize: '10px', fontFamily: ADMIN_COLORS.font }}>
                        #{devisNum}
                      </span>
                      {q.role_client === "vip" && (
                        <span style={{
                          background: ADMIN_COLORS.purpleBtn, color: '#fff',
                          fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                          fontFamily: ADMIN_COLORS.font,
                        }}>
                          VIP
                        </span>
                      )}
                    </div>
                    {/* Right: price + facturé badge + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: ADMIN_COLORS.navy, fontSize: '13px', fontWeight: 700, fontFamily: ADMIN_COLORS.font }}>
                        {formatEur(total)}
                      </span>
                      {q.facture_generee && (
                        <span style={{
                          background: ADMIN_COLORS.greenBtn, color: '#fff',
                          fontSize: '9px', padding: '2px 8px', borderRadius: '10px',
                          fontFamily: ADMIN_COLORS.font,
                        }}>
                          Facturé
                        </span>
                      )}
                      {statut !== "non_conforme" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); (async () => { if (!supabase) return; await supabase.from("quotes").update({ statut: "non_conforme" }).eq("id", q.id); await load(); })(); }}
                          title="Marquer Non Conforme"
                          style={{
                            background: '#991B1B', color: '#fff', border: 'none', borderRadius: '4px',
                            fontSize: '9px', padding: '2px 6px', cursor: 'pointer', fontWeight: 600,
                            fontFamily: ADMIN_COLORS.font,
                          }}
                        >
                          NC
                        </button>
                      )}
                      <span style={{ color: ADMIN_COLORS.grayText, fontSize: '16px', fontFamily: ADMIN_COLORS.font }}>›</span>
                    </div>
                  </div>
                )}

                {/* ── OPENED QUOTE ─────────────────── */}
                {isOpen && (
                  <AdminCard>
                    {/* ── HEADER NAVY (only when open) ─────────────────── */}
                    <div
                      onClick={() => setExpandedId(null)}
                      style={{
                        background: '#1E3A5F',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontFamily: ADMIN_COLORS.font,
                      }}
                    >
                      {/* Left: numero_devis + badge + VIP */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: ADMIN_COLORS.font }}>
                          #{devisNum}
                        </span>
                        <BadgeStatut statut={statut} />
                        {q.role_client === "vip" && (
                          <span style={{
                            background: ADMIN_COLORS.purpleBtn, color: '#fff',
                            fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                            fontFamily: ADMIN_COLORS.font,
                          }}>
                            VIP
                          </span>
                        )}
                      </div>
                      {/* Right: client name + email/date */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600, fontFamily: ADMIN_COLORS.font }}>
                          {q.nom}
                        </div>
                        <div style={{ color: '#93C5FD', fontSize: '10px', fontFamily: ADMIN_COLORS.font }}>
                          {q.email} — {new Date(q.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>

                    {/* ── STEP BAR ─────────────────── */}
                    <div style={{
                      background: '#F8FAFC',
                      padding: '7px 16px',
                      borderBottom: '0.5px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: ADMIN_COLORS.font,
                    }}>
                      <span style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, fontWeight: 600, textTransform: 'uppercase', marginRight: '4px', fontFamily: ADMIN_COLORS.font }}>
                        ÉTAPES ADMIN :
                      </span>
                      {/* Step 1: Reçu - always green */}
                      <span style={{ fontSize: '9px', color: '#16A34A', fontWeight: 600, fontFamily: ADMIN_COLORS.font }}>
                        ① Reçu ✅
                      </span>
                      <span style={{ color: '#D1D5DB', fontSize: '9px' }}>→</span>
                      {/* Step 2: VIP */}
                      <span style={{
                        fontSize: '9px', fontWeight: 600, fontFamily: ADMIN_COLORS.font,
                        color: q.role_client === "vip" ? '#16A34A' : '#7C3AED',
                      }}>
                        {q.role_client === "vip" ? '② VIP ✅' : '② Passer en VIP'}
                      </span>
                      <span style={{ color: '#D1D5DB', fontSize: '9px' }}>→</span>
                      {/* Step 3: Payment */}
                      <span style={{
                        fontSize: '9px', fontWeight: 600, fontFamily: ADMIN_COLORS.font,
                        color: q.facture_generee ? '#16A34A' : ADMIN_COLORS.grayText,
                      }}>
                        {q.facture_generee ? '③ Paiement ✅' : '③ Paiement'}
                      </span>
                      <span style={{ color: '#D1D5DB', fontSize: '9px' }}>→</span>
                      {/* Step 4: Documents - always gray */}
                      <span style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, fontWeight: 600, fontFamily: ADMIN_COLORS.font }}>
                        ④ Envoyer documents
                      </span>
                    </div>

                    {/* VIP flash msg */}
                    {vipMsg[q.id] && (
                      <div style={{
                        margin: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                        background: ADMIN_COLORS.purpleBg, color: ADMIN_COLORS.purpleText,
                        fontSize: '11px', fontWeight: 500, borderRadius: '6px', padding: '8px 12px',
                        border: `0.5px solid ${ADMIN_COLORS.purpleBorder}`,
                        fontFamily: ADMIN_COLORS.font,
                      }}>
                        <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} /> {vipMsg[q.id]}
                      </div>
                    )}

                    {/* ── CONTENU DÉPLIÉ — 2-column grid ─────────────── */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 340px',
                      fontFamily: ADMIN_COLORS.font,
                    }}>

                      {/* ── COLONNE GAUCHE ──────────── */}
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                        {/* Infos client */}
                        <div style={{
                          background: ADMIN_COLORS.infoBg, border: `0.5px solid ${ADMIN_COLORS.infoBorder}`,
                          borderRadius: '8px', padding: '10px 12px',
                        }}>
                          <SectionLabel>Informations client</SectionLabel>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: ADMIN_COLORS.grayTextDark, fontFamily: ADMIN_COLORS.font }}>
                            <div><span style={{ color: ADMIN_COLORS.grayText }}>Adresse : </span>{q.adresse_client || "—"}</div>
                            <div><span style={{ color: ADMIN_COLORS.grayText }}>Ville : </span>{q.ville_client || "—"}</div>
                            <div><span style={{ color: ADMIN_COLORS.grayText }}>Pays : </span>{q.pays_client || "—"}</div>
                            <div><span style={{ color: ADMIN_COLORS.grayText }}>Rôle : </span>{q.role_client || "—"}</div>
                          </div>
                          {q.message && (
                            <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, marginTop: '6px', fontStyle: 'italic', fontFamily: ADMIN_COLORS.font }}>
                              « {q.message} »
                            </p>
                          )}
                        </div>

                        {/* Produits with strikethrough prices */}
                        <div style={{
                          background: '#fff', border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                          borderRadius: '8px', padding: '10px 12px',
                        }}>
                          <SectionLabel>Produits</SectionLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                            {(q.produits || []).map((p: any, i: number) => {
                              const prixPublic = p.prixAffiche ?? (p.prixUnitaire ? p.prixUnitaire * 2 : 0);
                              const hasPrixNegocie = q.prix_negocie != null && q.prix_negocie > 0;
                              const partenaireCode = selectedPartner && selectedPartnerId !== ADMIN_PARTNER_ID
                                ? selectedPartner.nom?.replace(/\s/g, '').slice(0, 6).toUpperCase()
                                : null;
                              return (
                                <div key={i}>
                                  {hasPrixNegocie ? (
                                    <>
                                      {/* Line 1: strikethrough public price */}
                                      <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: '11px', color: ADMIN_COLORS.grayText,
                                        padding: '3px 6px', background: '#F9FAFB',
                                        borderBottom: '0.5px solid #F3F4F6',
                                        fontFamily: ADMIN_COLORS.font,
                                      }}>
                                        <span>{p.nom || p.name || p.id}{(p.quantite ?? 1) > 1 ? ` ×${p.quantite}` : ""}</span>
                                        <span style={{ textDecoration: 'line-through', color: ADMIN_COLORS.grayText }}>
                                          {formatEur(prixPublic)}
                                        </span>
                                      </div>
                                      {/* Line 2: purple VIP price */}
                                      <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: '11px', color: '#6B21A8',
                                        padding: '3px 6px', background: '#FAF5FF',
                                        borderBottom: i < (q.produits || []).length - 1 ? `0.5px solid ${ADMIN_COLORS.grayBorder}` : 'none',
                                        fontFamily: ADMIN_COLORS.font,
                                      }}>
                                        <span style={{ fontWeight: 600 }}>
                                          {p.nom || p.name || p.id} ★ VIP-{partenaireCode || 'REMISÉ'}
                                        </span>
                                        <span style={{ fontWeight: 700, color: '#6B21A8' }}>
                                          {formatEur(p.prixAffiche ?? p.prixUnitaire ?? 0)}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    /* Single normal line (no strikethrough) */
                                    <div style={{
                                      display: 'flex', justifyContent: 'space-between',
                                      fontSize: '11px', color: ADMIN_COLORS.grayTextDark,
                                      padding: '3px 6px',
                                      borderBottom: i < (q.produits || []).length - 1 ? `0.5px solid ${ADMIN_COLORS.grayBorder}` : 'none',
                                      fontFamily: ADMIN_COLORS.font,
                                    }}>
                                      <span>{p.nom || p.name || p.id}{(p.quantite ?? 1) > 1 ? ` ×${p.quantite}` : ""}</span>
                                      {p.prixAffiche != null && (
                                        <span style={{ fontWeight: 600, color: ADMIN_COLORS.navyAccent }}>
                                          {formatEur(p.prixAffiche)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            marginTop: '8px', paddingTop: '6px',
                            borderTop: `1px solid ${ADMIN_COLORS.navyBorder}`,
                            fontSize: '12px', fontWeight: 700, color: ADMIN_COLORS.navy,
                            fontFamily: ADMIN_COLORS.font,
                          }}>
                            <span>Total</span>
                            <span>{formatEur(total)}</span>
                          </div>
                        </div>

                        {/* Paiements dynamiques depuis acomptes */}
                        <div>
                          <SectionLabel>Suivi paiements</SectionLabel>
                          {(() => {
                            const acomptes: any[] = Array.isArray((q as any).acomptes) ? (q as any).acomptes : [];
                            const totalEncaisse = acomptes
                              .filter((a: any) => a.statut === "encaisse" || a.statut === "valide")
                              .reduce((s: number, a: any) => s + Number(a.montant || 0), 0);
                            const soldeRestant = total - totalEncaisse;

                            return (
                              <>
                                {acomptes.map((a: any, idx: number) => (
                                  <PaiementRow
                                    key={idx}
                                    numero={a.numero ?? idx + 1}
                                    montant={Number(a.montant || 0)}
                                    type={a.type === "pro" ? "virement pro" : a.type === "perso" ? "virement perso" : `acompte ${idx + 1}`}
                                    statut={a.statut === "encaisse" || a.statut === "valide" ? "paye" : "en_attente"}
                                    onEncaisser={
                                      a.statut !== "encaisse" && a.statut !== "valide"
                                        ? async () => {
                                            if (!supabase) return;
                                            setSaving("enc_" + q.id + "_" + idx);
                                            const updated = [...acomptes];
                                            updated[idx] = { ...updated[idx], statut: "encaisse", date_encaissement: new Date().toISOString() };
                                            const newTotalEnc = updated
                                              .filter((x: any) => x.statut === "encaisse" || x.statut === "valide")
                                              .reduce((s: number, x: any) => s + Number(x.montant || 0), 0);
                                            const newSolde = total - newTotalEnc;
                                            await supabase.from("quotes").update({
                                              acomptes: updated,
                                              total_encaisse: newTotalEnc,
                                              solde_restant: newSolde,
                                            }).eq("id", q.id);
                                            // Générer facture cumulative
                                            const factData = await buildFactureData({ ...q, acomptes: updated } as any);
                                            factData.acomptes = updated.filter((x: any) => x.statut === "encaisse" || x.statut === "valide").map((x: any, i: number) => ({
                                              numero: x.numero ?? i + 1,
                                              montant: Number(x.montant || 0),
                                              date: x.date_encaissement || x.date || new Date().toISOString(),
                                            }));
                                            const blob = generateFacturePDF(factData);
                                            downloadBlob(blob, `Facture_${factureNum}.pdf`);
                                            // Upload PDF
                                            try {
                                              const fileName = `FA${factureNum.replace(/^FA/, "")}.pdf`;
                                              await supabase.storage.from("invoices").upload(fileName, blob, { contentType: "application/pdf", upsert: true });
                                              const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);
                                              await supabase.from("invoices").upsert({
                                                numero_facture: factureNum,
                                                quote_id: q.id,
                                                montant_ht: total,
                                                montant_acompte: newTotalEnc,
                                                type_facture: newSolde <= 0 ? "solde" : "acompte",
                                                type_paiement: a.type || null,
                                                pdf_url: urlData?.publicUrl || null,
                                                statut: "emise",
                                                envoye_client: false,
                                              }, { onConflict: "numero_facture" });
                                            } catch (e) { console.warn("Upload facture:", e); }
                                            // Email notification
                                            if (q.email) {
                                              sendAcompteNotification({
                                                email: q.email, nomClient: q.nom || "Client",
                                                montant: Number(a.montant), numeroDevis: q.numero_devis || q.id.slice(0, 8),
                                              }).catch(() => {});
                                            }
                                            setSaving(null);
                                            await load();
                                          }
                                        : undefined
                                    }
                                    onPdf={async () => {
                                      const factData = await buildFactureData({ ...q, acomptes } as any);
                                      factData.acomptes = acomptes.filter((x: any) => x.statut === "encaisse" || x.statut === "valide").map((x: any, i: number) => ({
                                        numero: x.numero ?? i + 1,
                                        montant: Number(x.montant || 0),
                                        date: x.date_encaissement || x.date || new Date().toISOString(),
                                      }));
                                      downloadBlob(generateFacturePDF(factData), `Facture_${factureNum}.pdf`);
                                    }}
                                  />
                                ))}
                                {acomptes.length === 0 && (
                                  <div style={{ fontSize: "11px", color: ADMIN_COLORS.grayText, padding: "6px 0", fontFamily: ADMIN_COLORS.font }}>
                                    Aucun acompte demandé par le client
                                  </div>
                                )}
                                <PaiementResume
                                  totalEncaisse={totalEncaisse}
                                  soldeRestant={soldeRestant}
                                />
                              </>
                            );
                          })()}
                        </div>

                        {/* Partenaire & Commission */}
                        <div style={{
                          background: ADMIN_COLORS.purpleBg,
                          border: `0.5px solid ${ADMIN_COLORS.purpleBorder}`,
                          borderRadius: '8px', padding: '10px 12px',
                        }}>
                          <SectionLabel>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Handshake style={{ width: 12, height: 12 }} /> Partenaire & Commission
                            </span>
                          </SectionLabel>
                          {!q.partner_id && !selectedPartnerId ? (
                            <p style={{ color: '#9CA3AF', fontSize: '11px', fontFamily: ADMIN_COLORS.font, margin: '4px 0' }}>
                              Aucun partenaire rattaché à ce devis
                            </p>
                          ) : (
                          <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <AdminSelect
                              label="Partenaire"
                              value={selectedPartnerId}
                              onChange={(v) => patch(q.id, "partner_id", v)}
                              options={partners.map((p) => ({ value: p.id, label: p.nom }))}
                            />
                            <div>
                              <label style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, display: 'block', marginBottom: '3px', fontFamily: ADMIN_COLORS.font }}>
                                Commission calculée
                              </label>
                              <div style={{
                                background: '#fff', border: `0.5px solid ${ADMIN_COLORS.purpleBorder}`,
                                borderRadius: '4px', padding: '5px 8px', fontSize: '11px',
                                fontFamily: ADMIN_COLORS.font,
                              }}>
                                <span style={{ fontWeight: 700, color: ADMIN_COLORS.purpleText }}>
                                  {formatEur(commission)}
                                </span>
                                <span style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, marginLeft: '6px' }}>
                                  (partenaire {formatEur(prixPartenaire)})
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {q.commission_payee ? (
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: ADMIN_COLORS.greenBg, color: ADMIN_COLORS.greenText,
                                fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px',
                                fontFamily: ADMIN_COLORS.font,
                              }}>
                                <CheckCircle2 style={{ width: 12, height: 12 }} /> Payée ✓
                              </span>
                            ) : (
                              <AdminButton variant="success" size="sm" onClick={() => marquerCommissionPayee(q)}
                                disabled={saving === "pay_" + q.id}>
                                Marquer payée
                              </AdminButton>
                            )}
                          </div>
                          </>
                          )}
                        </div>

                        {/* Actions admin */}
                        <div style={{
                          background: ADMIN_COLORS.grayBg, borderRadius: '8px', padding: '10px 12px',
                          border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                        }}>
                          <SectionLabel>Actions admin</SectionLabel>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <AdminSelect
                              label="Statut"
                              value={ed.statut ?? q.statut}
                              onChange={(v) => patch(q.id, "statut", v)}
                              options={Object.entries(STATUT_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                            />
                            <AdminInput
                              label="Prix négocié (€)"
                              type="number"
                              value={ed.prix_negocie ?? q.prix_negocie ?? ""}
                              onChange={(v) => patch(q.id, "prix_negocie", v ? Number(v) : null)}
                              placeholder="Ex : 12000"
                            />
                          </div>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, display: 'block', marginBottom: '3px', fontFamily: ADMIN_COLORS.font }}>
                              Notes admin
                            </label>
                            <textarea
                              rows={2}
                              value={ed.notes_admin ?? q.notes_admin ?? ""}
                              onChange={(e) => patch(q.id, "notes_admin", e.target.value)}
                              placeholder="Notes internes…"
                              style={{
                                width: '100%', fontSize: '11px', padding: '5px 8px',
                                border: `0.5px solid ${ADMIN_COLORS.navyBorder}`,
                                borderRadius: '4px', outline: 'none', background: '#fff',
                                color: ADMIN_COLORS.navy, boxSizing: 'border-box', resize: 'none',
                                fontFamily: ADMIN_COLORS.font,
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <AdminButton variant="primary" size="md" onClick={() => save(q.id)}
                              disabled={saving === q.id}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {saving === q.id
                                  ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                  : <Save style={{ width: 12, height: 12 }} />
                                }
                                Sauvegarder
                              </span>
                            </AdminButton>
                            <AdminButton variant="purple" size="md" onClick={() => passerEnVip(q)}
                              disabled={saving === q.id}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Crown style={{ width: 12, height: 12 }} /> Passer en VIP
                              </span>
                            </AdminButton>
                          </div>
                        </div>
                      </div>

                      {/* ── COLONNE DROITE (340px) — Documents ──── */}
                      <div style={{
                        borderLeft: '0.5px solid #E5E7EB',
                        padding: '12px',
                        display: 'flex', flexDirection: 'column', gap: '6px',
                      }}>
                        <SectionLabel>Documents</SectionLabel>

                        {/* ── Devis PDF ── */}
                        <div style={{
                          background: ADMIN_COLORS.infoBg, border: `0.5px solid ${ADMIN_COLORS.infoBorder}`,
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: ADMIN_COLORS.infoText, fontFamily: ADMIN_COLORS.font }}>
                                Devis
                              </span>
                              <span style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, marginLeft: '6px', fontFamily: ADMIN_COLORS.font }}>
                                #{devisNum}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={async () => downloadBlob(generateDevisPDF(await buildDevisData(q)), `Devis_${devisNum}.pdf`)}
                                style={docBtnStyle(ADMIN_COLORS.infoBtn)}
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => envoyerDocument(q, "Devis", devisNum)}
                                style={docBtnStyle('#2563EB')}
                              >
                                → Client
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ── Facture FA ── green */}
                        <div style={{
                          background: '#F0FDF4', border: '0.5px solid #86EFAC',
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534', fontFamily: ADMIN_COLORS.font }}>
                                Facture FA
                              </span>
                              <span style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, marginLeft: '6px', fontFamily: ADMIN_COLORS.font }}>
                                {formatEur(total)}
                              </span>
                              {q.facture_generee && (
                                <span style={{
                                  background: '#16A34A', color: '#fff',
                                  fontSize: '8px', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px',
                                  fontFamily: ADMIN_COLORS.font,
                                }}>
                                  ✓
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={async () => {
                                  const fd = await buildFactureData(q);
                                  downloadBlob(generateFacturePDF(fd), `Facture_${factureNum}.pdf`);
                                }}
                                style={docBtnStyle('#166534')}
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => envoyerDocument(q, "Facture", factureNum)}
                                style={docBtnStyle('#16A34A')}
                              >
                                → Client
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize: '9px', color: '#166534', marginTop: '3px', opacity: 0.7, fontFamily: ADMIN_COLORS.font }}>
                            Mise à jour à chaque acompte
                          </div>
                        </div>

                        {/* Facture acompte 30% et solde SUPPRIMÉS — une seule FA cumulative */}

                        {/* ── Frais Maritimes FM ── blue */}
                        <div style={{
                          background: '#EFF6FF', border: '0.5px solid #BFDBFE',
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E3A5F', fontFamily: ADMIN_COLORS.font }}>
                              Frais Maritimes FM
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => genererFrais(q, "maritime")}
                                style={docBtnStyle('#1E3A5F')}
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => envoyerDocument(q, "Frais maritimes", `FM${devisNum.replace(/^D/, "")}`)}
                                style={docBtnStyle('#2563EB')}
                              >
                                → Client
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              value={currentFm.libelle}
                              onChange={(e) => setFmData(prev => ({ ...prev, [fmKey]: { ...currentFm, libelle: e.target.value } }))}
                              placeholder="Libellé"
                              style={{
                                flex: 1, fontSize: '9px', padding: '3px 6px',
                                border: '0.5px solid #BFDBFE', borderRadius: '3px',
                                background: '#fff', color: '#1E3A5F', fontFamily: ADMIN_COLORS.font,
                              }}
                            />
                            <input
                              type="number"
                              value={currentFm.montant || ''}
                              onChange={(e) => setFmData(prev => ({ ...prev, [fmKey]: { ...currentFm, montant: Number(e.target.value) || 0 } }))}
                              placeholder="Montant €"
                              style={{
                                width: '70px', fontSize: '9px', padding: '3px 6px',
                                border: '0.5px solid #BFDBFE', borderRadius: '3px',
                                background: '#fff', color: '#1E3A5F', fontFamily: ADMIN_COLORS.font,
                              }}
                            />
                          </div>
                        </div>

                        {/* ── Dédouanement DD ── blue */}
                        <div style={{
                          background: '#EFF6FF', border: '0.5px solid #BFDBFE',
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E3A5F', fontFamily: ADMIN_COLORS.font }}>
                              Dédouanement DD
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => genererFrais(q, "dedouanement")}
                                style={docBtnStyle('#1E3A5F')}
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => envoyerDocument(q, "Dédouanement", `DD${devisNum.replace(/^D/, "")}`)}
                                style={docBtnStyle('#2563EB')}
                              >
                                → Client
                              </button>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              value={currentDd.libelle}
                              onChange={(e) => setDdData(prev => ({ ...prev, [ddKey]: { ...currentDd, libelle: e.target.value } }))}
                              placeholder="Libellé"
                              style={{
                                flex: 1, fontSize: '9px', padding: '3px 6px',
                                border: '0.5px solid #BFDBFE', borderRadius: '3px',
                                background: '#fff', color: '#1E3A5F', fontFamily: ADMIN_COLORS.font,
                              }}
                            />
                            <input
                              type="number"
                              value={currentDd.montant || ''}
                              onChange={(e) => setDdData(prev => ({ ...prev, [ddKey]: { ...currentDd, montant: Number(e.target.value) || 0 } }))}
                              placeholder="Montant €"
                              style={{
                                width: '70px', fontSize: '9px', padding: '3px 6px',
                                border: '0.5px solid #BFDBFE', borderRadius: '3px',
                                background: '#fff', color: '#1E3A5F', fontFamily: ADMIN_COLORS.font,
                              }}
                            />
                          </div>
                        </div>

                        {/* ── Bon de Livraison BL ── gray */}
                        <div style={{
                          background: '#F8FAFC', border: '0.5px solid #CBD5E1',
                          borderRadius: '6px', padding: '8px 10px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', fontFamily: ADMIN_COLORS.font }}>
                                Bon de Livraison BL
                              </span>
                              <span style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, marginLeft: '6px', fontFamily: ADMIN_COLORS.font }}>
                                BL{devisNum.replace(/^D/, "")}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => genererBL(q)}
                                style={docBtnStyle('#374151')}
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => envoyerDocument(q, "Bon de livraison", `BL${devisNum.replace(/^D/, "")}`)}
                                style={docBtnStyle('#4B5563')}
                              >
                                → Client
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ── Note Commission NC ── purple (only if partenaire != ADMIN) */}
                        {isNotAdmin && (
                          <div style={{
                            background: '#EDE9FE', border: '0.5px solid #D8B4FE',
                            borderRadius: '6px', padding: '8px 10px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6B21A8', fontFamily: ADMIN_COLORS.font }}>
                                  Note Commission NC
                                </span>
                                <span style={{ fontSize: '9px', color: '#6B21A8', marginLeft: '6px', opacity: 0.7, fontFamily: ADMIN_COLORS.font }}>
                                  {selectedPartner?.nom} — {formatEur(commission)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => genererCommission(q)}
                                  style={docBtnStyle('#7C3AED')}
                                >
                                  PDF
                                </button>
                                <button
                                  onClick={() => envoyerDocument(q, "Note de commission", `C${devisNum.replace(/^D/, "")}`)}
                                  style={docBtnStyle('#6B21A8')}
                                >
                                  → TD seulement
                                </button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '8px', color: '#6B21A8', display: 'block', marginBottom: '2px', fontFamily: ADMIN_COLORS.font }}>Prix remisé</label>
                                <input
                                  type="number"
                                  value={currentNc.prixRemise || ''}
                                  onChange={(e) => setNcData(prev => ({ ...prev, [ncKey]: { ...currentNc, prixRemise: Number(e.target.value) || 0 } }))}
                                  style={{
                                    width: '100%', fontSize: '9px', padding: '3px 6px',
                                    border: '0.5px solid #D8B4FE', borderRadius: '3px',
                                    background: '#fff', color: '#6B21A8', boxSizing: 'border-box',
                                    fontFamily: ADMIN_COLORS.font,
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '8px', color: '#6B21A8', display: 'block', marginBottom: '2px', fontFamily: ADMIN_COLORS.font }}>Prix partenaire</label>
                                <input
                                  type="number"
                                  value={currentNc.prixPartenaire || ''}
                                  onChange={(e) => setNcData(prev => ({ ...prev, [ncKey]: { ...currentNc, prixPartenaire: Number(e.target.value) || 0 } }))}
                                  style={{
                                    width: '100%', fontSize: '9px', padding: '3px 6px',
                                    border: '0.5px solid #D8B4FE', borderRadius: '3px',
                                    background: '#fff', color: '#6B21A8', boxSizing: 'border-box',
                                    fontFamily: ADMIN_COLORS.font,
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '8px', color: '#6B21A8', display: 'block', marginBottom: '2px', fontFamily: ADMIN_COLORS.font }}>Commission</label>
                                <input
                                  type="number"
                                  value={currentNc.commission || ''}
                                  onChange={(e) => setNcData(prev => ({ ...prev, [ncKey]: { ...currentNc, commission: Number(e.target.value) || 0 } }))}
                                  style={{
                                    width: '100%', fontSize: '9px', padding: '3px 6px',
                                    border: '0.5px solid #D8B4FE', borderRadius: '3px',
                                    background: '#fff', color: '#6B21A8', boxSizing: 'border-box',
                                    fontFamily: ADMIN_COLORS.font,
                                  }}
                                />
                              </div>
                            </div>
                            <div style={{ fontSize: '9px', color: '#6B21A8', fontWeight: 600, fontFamily: ADMIN_COLORS.font }}>
                              ⚠️ Non envoyé au client
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AdminCard>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
