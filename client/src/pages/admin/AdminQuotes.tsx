import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Save, Crown, Download, Handshake, CheckCircle2 } from "lucide-react";
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
// Design system admin
import {
  ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton, BadgeStatut,
  SectionLabel, DocumentRow, PaiementRow, PaiementResume, AdminInput, AdminSelect,
} from "@/components/admin/AdminUI";

const ADMIN_PARTNER_ID = "00000000-0000-0000-0000-000000000001";

type Statut = "nouveau" | "en_cours" | "negociation" | "accepte" | "refuse";

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
    const factureData = buildFactureData(q);
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
    const feesData: FeesData = {
      numeroDocument: num, date: today, type: typeFrais,
      client: {
        nom: q.nom, adresse: q.adresse_client, ville: q.ville_client,
        pays: q.pays_client, email: q.email, telephone: q.telephone,
      },
      referenceDevis: q.numero_devis,
      lignes: [{ designation: typeFrais === "maritime" ? "Frais de transport maritime" : "Frais de dédouanement", montant: 0 }],
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
    const ok = await sendDocumentNotification({
      email: q.email, nomClient: q.nom,
      typeDocument: typeDoc, numeroDocument: numDoc,
    });
    setSaving(null);
    if (ok) {
      setVipMsg((prev) => ({ ...prev, [q.id]: `✉ ${typeDoc} ${numDoc} envoyé à ${q.email}` }));
    } else {
      setVipMsg((prev) => ({ ...prev, [q.id]: `⚠ Envoi non disponible (configurer Edge Function "send-email")` }));
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

  // ── RENDU ──────────────────────────────────

  return (
    <div style={{ background: ADMIN_COLORS.pageBg, minHeight: '100vh', padding: '0' }}>
      {/* Header page */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>
            Devis & Facturation
          </h2>
          <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: '2px 0 0' }}>
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
        {(["tous", "nouveau", "en_cours", "negociation", "accepte", "refuse"] as const).map((s) => (
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
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: ADMIN_COLORS.grayText, fontSize: '12px' }}>
          Aucun devis trouvé
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {quotes.map((q) => {
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

            return (
              <AdminCard key={q.id}>
                {/* ── HEADER NAVY ─────────────────── */}
                <div
                  onClick={() => setExpandedId(isOpen ? null : q.id)}
                  style={{
                    background: ADMIN_COLORS.navy,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BadgeStatut statut={statut} />
                    {q.role_client === "vip" && (
                      <span style={{
                        background: ADMIN_COLORS.purpleBtn, color: '#fff',
                        fontSize: '9px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                      }}>
                        VIP
                      </span>
                    )}
                    <div>
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
                        {q.nom}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginLeft: '8px' }}>
                        #{devisNum}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {q.facture_generee && (
                      <span style={{
                        background: ADMIN_COLORS.greenBtn, color: '#fff',
                        fontSize: '9px', padding: '2px 8px', borderRadius: '10px',
                      }}>
                        Facturé
                      </span>
                    )}
                    {q.commission_payee && (
                      <span style={{
                        background: ADMIN_COLORS.orangeBtn, color: '#fff',
                        fontSize: '9px', padding: '2px 8px', borderRadius: '10px',
                      }}>
                        Comm. payée ✓
                      </span>
                    )}
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                      {formatEur(total)}
                    </span>
                    {isOpen
                      ? <ChevronUp style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
                      : <ChevronDown style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
                    }
                  </div>
                </div>

                {/* ── Sous-header : email + date ── */}
                {isOpen && (
                  <div style={{
                    background: '#111827', padding: '6px 14px',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
                  }}>
                    <span>{q.email} — {q.telephone || "—"}</span>
                    <span>{new Date(q.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                )}

                {/* VIP flash msg */}
                {vipMsg[q.id] && (
                  <div style={{
                    margin: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                    background: ADMIN_COLORS.purpleBg, color: ADMIN_COLORS.purpleText,
                    fontSize: '11px', fontWeight: 500, borderRadius: '6px', padding: '8px 12px',
                    border: `0.5px solid ${ADMIN_COLORS.purpleBorder}`,
                  }}>
                    <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} /> {vipMsg[q.id]}
                  </div>
                )}

                {/* ── CONTENU DÉPLIÉ ─────────────── */}
                {isOpen && (
                  <div style={{ padding: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                    {/* ── COLONNE GAUCHE ──────────── */}
                    <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* Infos client */}
                      <div style={{
                        background: ADMIN_COLORS.infoBg, border: `0.5px solid ${ADMIN_COLORS.infoBorder}`,
                        borderRadius: '8px', padding: '10px 12px',
                      }}>
                        <SectionLabel>Informations client</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: ADMIN_COLORS.grayTextDark }}>
                          <div><span style={{ color: ADMIN_COLORS.grayText }}>Adresse : </span>{q.adresse_client || "—"}</div>
                          <div><span style={{ color: ADMIN_COLORS.grayText }}>Ville : </span>{q.ville_client || "—"}</div>
                          <div><span style={{ color: ADMIN_COLORS.grayText }}>Pays : </span>{q.pays_client || "—"}</div>
                          <div><span style={{ color: ADMIN_COLORS.grayText }}>Rôle : </span>{q.role_client || "—"}</div>
                        </div>
                        {q.message && (
                          <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, marginTop: '6px', fontStyle: 'italic' }}>
                            « {q.message} »
                          </p>
                        )}
                      </div>

                      {/* Produits */}
                      <div style={{
                        background: '#fff', border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                        borderRadius: '8px', padding: '10px 12px',
                      }}>
                        <SectionLabel>Produits</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {(q.produits || []).map((p: any, i: number) => (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between',
                              fontSize: '11px', color: ADMIN_COLORS.grayTextDark,
                              padding: '3px 0', borderBottom: i < (q.produits || []).length - 1 ? `0.5px solid ${ADMIN_COLORS.grayBorder}` : 'none',
                            }}>
                              <span>{p.nom || p.name || p.id}{(p.quantite ?? 1) > 1 ? ` ×${p.quantite}` : ""}</span>
                              {p.prixAffiche != null && (
                                <span style={{ fontWeight: 600, color: ADMIN_COLORS.navyAccent }}>
                                  {formatEur(p.prixAffiche)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          marginTop: '8px', paddingTop: '6px',
                          borderTop: `1px solid ${ADMIN_COLORS.navyBorder}`,
                          fontSize: '12px', fontWeight: 700, color: ADMIN_COLORS.navy,
                        }}>
                          <span>Total</span>
                          <span>{formatEur(total)}</span>
                        </div>
                      </div>

                      {/* Paiements (acompte / solde) */}
                      <div>
                        <SectionLabel>Suivi paiements</SectionLabel>
                        <PaiementRow
                          numero={1}
                          montant={Math.round(total * 0.3)}
                          type="acompte 30%"
                          statut="en_attente"
                          onEncaisser={() => genererFacture(q, "acompte")}
                          onPdf={() => {
                            const factData = buildFactureData(q);
                            factData.totalHT = Math.round(total * 0.3);
                            factData.numeroFacture = factureNum + "-AC";
                            downloadBlob(generateFacturePDF(factData), `Acompte_${factureNum}.pdf`);
                          }}
                        />
                        <PaiementRow
                          numero={2}
                          montant={Math.round(total * 0.7)}
                          type="solde 70%"
                          statut="en_attente"
                          onEncaisser={() => genererFacture(q, "solde")}
                          onPdf={() => {
                            const factData = buildFactureData(q);
                            factData.totalHT = Math.round(total * 0.7);
                            factData.numeroFacture = factureNum + "-SO";
                            downloadBlob(generateFacturePDF(factData), `Solde_${factureNum}.pdf`);
                          }}
                        />
                        <PaiementResume
                          totalEncaisse={0}
                          soldeRestant={total}
                        />
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <AdminSelect
                            label="Partenaire"
                            value={selectedPartnerId}
                            onChange={(v) => patch(q.id, "partner_id", v)}
                            options={partners.map((p) => ({ value: p.id, label: p.nom }))}
                          />
                          <div>
                            <label style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, display: 'block', marginBottom: '3px' }}>
                              Commission calculée
                            </label>
                            <div style={{
                              background: '#fff', border: `0.5px solid ${ADMIN_COLORS.purpleBorder}`,
                              borderRadius: '4px', padding: '5px 8px', fontSize: '11px',
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
                          <label style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, display: 'block', marginBottom: '3px' }}>
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

                    {/* ── COLONNE DROITE (380px) ──── */}
                    <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <SectionLabel>Documents</SectionLabel>

                      {/* Devis PDF */}
                      <DocumentRow
                        label="Devis"
                        sousTitre={`#${devisNum}`}
                        couleurFond={ADMIN_COLORS.infoBg}
                        couleurBordure={ADMIN_COLORS.infoBorder}
                        couleurTexte={ADMIN_COLORS.infoText}
                        couleurBouton={ADMIN_COLORS.infoBtn}
                        onGenerer={() => downloadBlob(generateDevisPDF(buildDevisData(q)), `Devis_${devisNum}.pdf`)}
                        onEnvoyer={() => envoyerDocument(q, "Devis", devisNum)}
                        onPdf={() => downloadBlob(generateDevisPDF(buildDevisData(q)), `Devis_${devisNum}.pdf`)}
                      />

                      {/* Facture totale */}
                      <DocumentRow
                        label="Facture totale"
                        sousTitre={`${formatEur(total)}`}
                        couleurFond={ADMIN_COLORS.greenBg}
                        couleurBordure={ADMIN_COLORS.greenBorder}
                        couleurTexte={ADMIN_COLORS.greenText}
                        couleurBouton={ADMIN_COLORS.greenBtn}
                        envoye={q.facture_generee}
                        onGenerer={() => genererFacture(q, "standard")}
                        onEnvoyer={() => envoyerDocument(q, "Facture", factureNum)}
                        onPdf={() => {
                          const fd = buildFactureData(q);
                          downloadBlob(generateFacturePDF(fd), `Facture_${factureNum}.pdf`);
                        }}
                      />

                      {/* Facture acompte */}
                      <DocumentRow
                        label="Facture acompte 30%"
                        sousTitre={`${formatEur(Math.round(total * 0.3))}`}
                        couleurFond={ADMIN_COLORS.orangeBg}
                        couleurBordure={ADMIN_COLORS.orangeBorder}
                        couleurTexte={ADMIN_COLORS.orangeText}
                        couleurBouton={ADMIN_COLORS.orangeBtn}
                        onGenerer={() => genererFacture(q, "acompte")}
                        onEnvoyer={() => envoyerDocument(q, "Facture acompte", factureNum + "-AC")}
                        onPdf={() => {
                          const fd = buildFactureData(q);
                          fd.totalHT = Math.round(total * 0.3);
                          fd.numeroFacture = factureNum + "-AC";
                          downloadBlob(generateFacturePDF(fd), `Acompte_${factureNum}.pdf`);
                        }}
                      />

                      {/* Facture solde */}
                      <DocumentRow
                        label="Facture solde"
                        sousTitre={`${formatEur(Math.round(total * 0.7))}`}
                        couleurFond={ADMIN_COLORS.greenBg}
                        couleurBordure={ADMIN_COLORS.greenBorder}
                        couleurTexte={ADMIN_COLORS.greenText}
                        couleurBouton={ADMIN_COLORS.greenBtn}
                        onGenerer={() => genererFacture(q, "solde")}
                        onEnvoyer={() => envoyerDocument(q, "Facture solde", factureNum + "-SO")}
                        onPdf={() => {
                          const fd = buildFactureData(q);
                          fd.totalHT = Math.round(total * 0.7);
                          fd.numeroFacture = factureNum + "-SO";
                          downloadBlob(generateFacturePDF(fd), `Solde_${factureNum}.pdf`);
                        }}
                      />

                      {/* Frais maritimes */}
                      <DocumentRow
                        label="Frais maritimes"
                        sousTitre={`FM${devisNum.replace(/^D/, "")}`}
                        couleurFond={ADMIN_COLORS.infoBg}
                        couleurBordure={ADMIN_COLORS.infoBorder}
                        couleurTexte={ADMIN_COLORS.infoText}
                        couleurBouton={ADMIN_COLORS.infoBtn}
                        onGenerer={() => genererFrais(q, "maritime")}
                        onEnvoyer={() => envoyerDocument(q, "Frais maritimes", `FM${devisNum.replace(/^D/, "")}`)}
                        onPdf={() => genererFrais(q, "maritime")}
                      />

                      {/* Dédouanement */}
                      <DocumentRow
                        label="Dédouanement"
                        sousTitre={`DD${devisNum.replace(/^D/, "")}`}
                        couleurFond={ADMIN_COLORS.purpleBg}
                        couleurBordure={ADMIN_COLORS.purpleBorder}
                        couleurTexte={ADMIN_COLORS.purpleText}
                        couleurBouton={ADMIN_COLORS.purpleBtn}
                        onGenerer={() => genererFrais(q, "dedouanement")}
                        onEnvoyer={() => envoyerDocument(q, "Dédouanement", `DD${devisNum.replace(/^D/, "")}`)}
                        onPdf={() => genererFrais(q, "dedouanement")}
                      />

                      {/* Bon de livraison */}
                      <DocumentRow
                        label="Bon de livraison"
                        sousTitre={`BL${devisNum.replace(/^D/, "")}`}
                        couleurFond={ADMIN_COLORS.greenBg}
                        couleurBordure={ADMIN_COLORS.greenBorder}
                        couleurTexte={ADMIN_COLORS.greenText}
                        couleurBouton={ADMIN_COLORS.greenBtn}
                        onGenerer={() => genererBL(q)}
                        onEnvoyer={() => envoyerDocument(q, "Bon de livraison", `BL${devisNum.replace(/^D/, "")}`)}
                        onPdf={() => genererBL(q)}
                      />

                      {/* Note de commission (seulement si partenaire != ADMIN) */}
                      {isNotAdmin && (
                        <DocumentRow
                          label="Note de commission"
                          sousTitre={`${selectedPartner?.nom} — ${formatEur(commission)}`}
                          couleurFond={ADMIN_COLORS.orangeBg}
                          couleurBordure={ADMIN_COLORS.orangeBorder}
                          couleurTexte={ADMIN_COLORS.orangeText}
                          couleurBouton={ADMIN_COLORS.orangeBtn}
                          onGenerer={() => genererCommission(q)}
                          onEnvoyer={() => envoyerDocument(q, "Note de commission", `C${devisNum.replace(/^D/, "")}`)}
                          onPdf={() => genererCommission(q)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
