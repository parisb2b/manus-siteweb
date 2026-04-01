import { useState, useEffect } from "react";
import { FileText, Loader2, ChevronRight, X, Download, Lock, CheckCircle2 } from "lucide-react";
import { generateDevisPDF, type DevisData } from "@/utils/generateDevisPDF";
import { generateFacturePDF, type FactureData } from "@/utils/generateFacturePDF";
import { formatEur } from "@/utils/calculPrix";
import { supabase } from "@/lib/supabase";
import { uploadPdfBlob } from "@/lib/storage";
import { sendEmail } from "@/lib/notifications";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  profile: any;
  role: string;
}

type Devis = {
  id: string;
  created_at: string;
  numero_devis?: string;
  produits?: any[];
  prix_total_calcule?: number;
  prix_negocie?: number;
  statut: string;
  facture_generee?: boolean;
  adresse_client?: string;
  ville_client?: string;
  pdf_url?: string | null;
  facture_url?: string | null;
  acomptes?: any[];
};

type DocInfo = {
  invoices: any[];
  fees: any[];
  delivery_notes: any[];
};

/* ── Acompte Pop-up ── */
type AcompteStep = 1 | 2 | 3;
type CompteType = "perso" | "pro";

const statutColors: Record<string, string> = {
  nouveau: "#DBEAFE",
  en_cours: "#FFEDD5",
  negociation: "#EDE9FE",
  accepte: "#D1FAE5",
  refuse: "#FEE2E2",
};
const statutTextColors: Record<string, string> = {
  nouveau: "#1D4ED8",
  en_cours: "#C2410C",
  negociation: "#6D28D9",
  accepte: "#059669",
  refuse: "#DC2626",
};
const statutLabels: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négociation",
  accepte: "Accepté",
  refuse: "Refusé",
};

export default function QuotesTab({ user, profile, role }: Props) {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Record<string, DocInfo>>({});
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Acompte popup state
  const [acompteQuote, setAcompteQuote] = useState<Devis | null>(null);
  const [acompteStep, setAcompteStep] = useState<AcompteStep>(1);
  const [acompteMontant, setAcompteMontant] = useState(500);
  const [compteType, setCompteType] = useState<CompteType>("perso");
  const [adminParams, setAdminParams] = useState<Record<string, any>>({});
  const [acompteSaving, setAcompteSaving] = useState(false);

  const fetchDevis = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("quotes")
      .select("id,created_at,numero_devis,produits,prix_total_calcule,prix_negocie,statut,facture_generee,adresse_client,ville_client,pdf_url,facture_url,acomptes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDevis((data as Devis[]) || []);
    setLoading(false);
  };

  // Load admin_params for RIB info
  const fetchParams = async () => {
    if (!supabase) return;
    const { data } = await supabase.from("admin_params").select("*");
    const map: Record<string, any> = {};
    (data || []).forEach((p: any) => { map[p.key] = p.value; });
    setAdminParams(map);
  };

  useEffect(() => { fetchDevis(); fetchParams(); }, [user.id]);

  // Load docs for expanded quote
  const loadDocs = async (quoteId: string) => {
    if (!supabase || docs[quoteId]) return;
    const [inv, fees, bl] = await Promise.all([
      supabase.from("invoices").select("*").eq("quote_id", quoteId),
      supabase.from("fees").select("*").eq("quote_id", quoteId),
      supabase.from("delivery_notes").select("*").eq("quote_id", quoteId),
    ]);
    setDocs(prev => ({
      ...prev,
      [quoteId]: {
        invoices: inv.data || [],
        fees: fees.data || [],
        delivery_notes: bl.data || [],
      },
    }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDocs(id);
    }
  };

  /* ── PDF downloads ── */
  const downloadDevisPdf = async (d: Devis) => {
    if (d.pdf_url) { window.open(d.pdf_url, "_blank"); return; }
    const today = new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const produitsArr = parseProduits(d.produits);
    const lignes = produitsArr.map((p: any) => {
      const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
      const qty = p.quantite ?? 1;
      return { nom: String(p.nom || p.name || "—"), description: p.description || "", prixUnitaire: pu, quantite: qty, total: Math.round(pu * qty) };
    });
    const numDevis = d.numero_devis || d.id.slice(0, 8).toUpperCase();
    const devisData: DevisData = {
      numeroDevis: numDevis, date: today,
      client: {
        nom: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email ?? "",
        adresse: d.adresse_client || "", ville: d.ville_client || "", pays: "France",
        email: user.email ?? "", telephone: profile?.phone || undefined,
      },
      produits: lignes, totalHT: lignes.reduce((s, l) => s + l.total, 0), role: role ?? "user",
    };
    const blob = generateDevisPDF(devisData);
    downloadBlob(blob, `Devis_${numDevis}.pdf`);
    const pdfUrl = await uploadPdfBlob(blob, "devis", `Devis_${numDevis}`);
    if (pdfUrl && supabase) {
      await supabase.from("quotes").update({ pdf_url: pdfUrl }).eq("id", d.id);
      setDevis(prev => prev.map(x => x.id === d.id ? { ...x, pdf_url: pdfUrl } : x));
    }
  };

  const downloadFacturePdf = async (d: Devis) => {
    if (d.facture_url) { window.open(d.facture_url, "_blank"); return; }
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const dateDevis = new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const produitsArr = parseProduits(d.produits);
    const lignes = produitsArr.map((p: any) => {
      const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
      const qty = p.quantite ?? 1;
      return { nom: String(p.nom || p.name || "—"), prixUnitaire: pu, quantite: qty, total: Math.round(pu * qty) };
    });
    const factureNum = (d.numero_devis || "D00001").replace("D", "FA");
    const factureData: FactureData = {
      numeroFacture: factureNum, dateFacture: today, numeroDevis: d.numero_devis, dateDevis,
      client: {
        nom: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email ?? "",
        adresse: d.adresse_client || "", ville: d.ville_client || "", pays: "France",
        email: user.email ?? "", telephone: profile?.phone || undefined,
      },
      produits: lignes, totalHT: lignes.reduce((s, l) => s + l.total, 0),
    };
    const blob = generateFacturePDF(factureData);
    downloadBlob(blob, `Facture_${factureNum}.pdf`);
    const factureUrl = await uploadPdfBlob(blob, "factures", `Facture_${factureNum}`);
    if (factureUrl && supabase) {
      await supabase.from("quotes").update({ facture_url: factureUrl }).eq("id", d.id);
      setDevis(prev => prev.map(x => x.id === d.id ? { ...x, facture_url: factureUrl } : x));
    }
  };

  /* ── Acompte logic ── */
  const openAcompte = (d: Devis) => {
    const total = d.prix_negocie ?? d.prix_total_calcule ?? 0;
    const acomptes = d.acomptes || [];
    const totalVerse = acomptes.reduce((s: number, a: any) => s + (a.montant ?? 0), 0);
    const solde = total - totalVerse;
    let montantDefaut = 500;
    if (acomptes.length === 0) montantDefaut = Math.min(500, solde);
    else if (acomptes.length === 1) montantDefaut = Math.round(solde / 2);
    else montantDefaut = solde;
    setAcompteMontant(montantDefaut);
    setAcompteQuote(d);
    setAcompteStep(1);
    setCompteType("perso");
  };

  const submitAcompte = async () => {
    if (!supabase || !acompteQuote) return;
    setAcompteSaving(true);
    const acomptes = acompteQuote.acomptes || [];
    const newAcompte = {
      numero: acomptes.length + 1,
      montant: acompteMontant,
      type: compteType,
      statut: "en_attente",
      date: new Date().toISOString(),
    };
    const updated = [...acomptes, newAcompte];
    await supabase.from("quotes").update({ acomptes: updated }).eq("id", acompteQuote.id);

    // Notification email admin
    try {
      const numDevis = acompteQuote.numero_devis || acompteQuote.id.slice(0, 8);
      const clientNom = profile?.full_name || profile?.prenom || user.email;
      await sendEmail({
        to: "parisb2b@gmail.com",
        subject: `Acompte ${newAcompte.numero} — Devis ${numDevis} — ${clientNom}`,
        html: `
          <h2>Nouvel acompte déclaré</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;">
            <tr><td style="padding:4px 12px;font-weight:bold;">Devis</td><td style="padding:4px 12px;">${numDevis}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Client</td><td style="padding:4px 12px;">${clientNom}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Email</td><td style="padding:4px 12px;">${user.email}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Acompte N°</td><td style="padding:4px 12px;">${newAcompte.numero}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Montant</td><td style="padding:4px 12px;">${acompteMontant.toLocaleString("fr-FR")} €</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Type compte</td><td style="padding:4px 12px;">${compteType === "pro" ? "Professionnel" : "Personnel"}</td></tr>
          </table>
          <p style="margin-top:16px;color:#6B7280;font-size:13px;">Le client déclare avoir effectué le virement. Veuillez vérifier la réception sur le compte bancaire.</p>
        `,
      });
    } catch {
      // Silencieux — ne pas bloquer le flux client
      console.warn("[QuotesTab] Échec envoi notification admin acompte");
    }

    setAcompteSaving(false);
    setAcompteQuote(null);
    setActionMsg("Votre demande a bien été enregistrée. Nous vous confirmerons dès réception du virement.");
    setTimeout(() => setActionMsg(null), 6000);
    fetchDevis();
  };

  /* ── Helpers ── */
  function parseProduits(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
    return [];
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function getAcompteInfo(d: Devis) {
    const total = d.prix_negocie ?? d.prix_total_calcule ?? 0;
    const acomptes = (d.acomptes || []).filter((a: any) => a.statut !== "refuse");
    const totalVerse = acomptes.reduce((s: number, a: any) => s + (a.montant ?? 0), 0);
    return { total, acomptes, totalVerse, solde: total - totalVerse };
  }

  /* ── Document Row helper ── */
  function DocRow({ label, available, onDownload, subtitle }: {
    label: string; available: boolean; onDownload?: () => void; subtitle?: string;
  }) {
    if (!available) {
      return (
        <div style={{
          opacity: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 10px", background: "#F9FAFB", border: "0.5px solid #E5E7EB",
          borderRadius: "6px", marginBottom: "4px",
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280" }}>📄 {label}</span>
            <span style={{ fontSize: "10px", color: "#9CA3AF", display: "block" }}>En attente</span>
          </div>
          <Lock style={{ width: 14, height: 14, color: "#9CA3AF" }} />
        </div>
      );
    }
    return (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 10px", background: "#F0FDF4", border: "0.5px solid #86EFAC",
        borderRadius: "6px", marginBottom: "4px",
      }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#166534" }}>📄 {label}</span>
          {subtitle && <span style={{ fontSize: "10px", color: "#6B7280", display: "block" }}>{subtitle}</span>}
        </div>
        <button
          onClick={onDownload}
          style={{
            background: "#1E3A5F", color: "#fff", border: "none", borderRadius: "4px",
            padding: "4px 10px", fontSize: "10px", fontWeight: 600, cursor: "pointer",
          }}
        >
          <Download style={{ width: 10, height: 10, display: "inline", marginRight: 4 }} />
          Télécharger
        </button>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Mes devis</h2>

      {actionMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "8px",
          padding: "10px 14px", color: "#059669", fontSize: "13px", marginBottom: "12px",
        }}>
          <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} /> {actionMsg}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 style={{ width: 32, height: 32, animation: "spin 1s linear infinite", color: "#4A90D9" }} />
        </div>
      ) : devis.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <FileText style={{ width: 48, height: 48, color: "#D1D5DB", margin: "0 auto 16px" }} />
          <p style={{ color: "#6B7280", fontWeight: 500 }}>Aucun devis pour le moment</p>
          <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "4px" }}>
            Ajoutez des produits au panier et générez votre premier devis.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {devis.map((d) => {
            const isExpanded = expandedId === d.id;
            const produits = parseProduits(d.produits);
            const { total, acomptes, totalVerse, solde } = getAcompteInfo(d);
            const quoteDocs = docs[d.id];

            return (
              <div key={d.id} style={{
                border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden",
                background: "#fff",
              }}>
                {/* Header cliquable */}
                <button
                  onClick={() => toggleExpand(d.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", background: "#fff", border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText style={{ width: 16, height: 16, color: "#4A90D9", flexShrink: 0 }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: "13px" }}>
                          {d.numero_devis || `#${d.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span style={{
                          fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
                          background: statutColors[d.statut] || "#F3F4F6",
                          color: statutTextColors[d.statut] || "#374151",
                        }}>
                          {statutLabels[d.statut] ?? d.statut}
                        </span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "2px 0 0" }}>
                        {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                        {" · "}{produits.length} produit{produits.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 700, color: "#1E3A5F", fontSize: "13px" }}>
                      {formatEur(total)}
                    </span>
                    {isExpanded
                      ? <X style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                      : <ChevronRight style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                    }
                  </div>
                </button>

                {/* Corps déplié */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F3F4F6" }}>

                    {/* SECTION 1 — Produits */}
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        Produits
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {produits.map((p: any, i: number) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "#fff", borderRadius: "6px", padding: "6px 10px",
                            border: "0.5px solid #F3F4F6", fontSize: "12px",
                          }}>
                            <span style={{ color: "#374151" }}>
                              {p.nom || p.name || "—"}{(p.quantite ?? 1) > 1 ? ` × ${p.quantite}` : ""}
                            </span>
                            {(p.prixUnitaire ?? p.prixAffiche) ? (
                              <span style={{ fontWeight: 500, color: "#374151" }}>
                                {formatEur((p.prixUnitaire ?? p.prixAffiche) * (p.quantite ?? 1))}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E5E7EB",
                      }}>
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: "13px" }}>Total</span>
                        <span style={{ fontWeight: 700, color: "#1E3A5F", fontSize: "15px" }}>{formatEur(total)}</span>
                      </div>
                    </div>

                    {/* SECTION 2 — Suivi paiements */}
                    {acomptes.length > 0 && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                          Suivi paiements
                        </p>
                        {acomptes.map((a: any, i: number) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: a.statut === "valide" ? "#F0FDF4" : "#FFFBEB",
                            border: `0.5px solid ${a.statut === "valide" ? "#86EFAC" : "#FDE68A"}`,
                            borderRadius: "6px", padding: "6px 10px", marginBottom: "3px", fontSize: "11px",
                          }}>
                            <span style={{ color: a.statut === "valide" ? "#166534" : "#92400E" }}>
                              Acompte {a.numero} {a.statut === "valide" ? "versé" : a.statut === "en_attente" ? "en attente" : ""} le {new Date(a.date).toLocaleDateString("fr-FR")}
                            </span>
                            <span style={{ fontWeight: 600, color: a.statut === "valide" ? "#166534" : "#92400E" }}>
                              {formatEur(a.montant)}
                            </span>
                          </div>
                        ))}
                        {solde > 0 && (
                          <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "#FFFBEB", border: "0.5px solid #FDE68A",
                            borderRadius: "6px", padding: "6px 10px", fontSize: "11px", fontWeight: 600,
                          }}>
                            <span style={{ color: "#92400E" }}>Solde restant</span>
                            <span style={{ color: "#EA580C" }}>{formatEur(solde)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bouton acompte */}
                    {solde > 0 && d.statut !== "refuse" && (
                      <button
                        onClick={() => openAcompte(d)}
                        style={{
                          width: "100%", background: "#EA580C", color: "#fff", border: "none",
                          borderRadius: "6px", padding: "10px", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", margin: "10px 0",
                        }}
                      >
                        Payer un acompte / le solde
                      </button>
                    )}

                    {/* SECTION 3 — Mes documents */}
                    <div style={{ marginTop: "14px" }}>
                      <p style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        Mes documents
                      </p>

                      {/* Devis — toujours disponible */}
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 10px", background: "#EFF6FF", border: "0.5px solid #BFDBFE",
                        borderRadius: "6px", marginBottom: "4px",
                      }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#1E3A5F" }}>
                          📄 Devis {d.numero_devis || ""}
                        </span>
                        <button
                          onClick={() => downloadDevisPdf(d)}
                          style={{
                            background: "#1E3A5F", color: "#fff", border: "none", borderRadius: "4px",
                            padding: "4px 10px", fontSize: "10px", fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Télécharger
                        </button>
                      </div>

                      {/* Facture FA */}
                      {(() => {
                        const inv = quoteDocs?.invoices?.find((i: any) => i.envoye_client);
                        return (
                          <DocRow
                            label={`Facture ${inv?.numero_facture || "FA"}`}
                            available={!!inv}
                            onDownload={() => downloadFacturePdf(d)}
                            subtitle={inv ? `${formatEur(inv.montant_acompte || 0)} versé` : undefined}
                          />
                        );
                      })()}

                      {/* Frais Maritimes FM */}
                      {(() => {
                        const fm = quoteDocs?.fees?.find((f: any) => f.type === "maritime" && f.envoye_client);
                        return <DocRow label="Frais Maritimes" available={!!fm} />;
                      })()}

                      {/* Dédouanement DD */}
                      {(() => {
                        const dd = quoteDocs?.fees?.find((f: any) => f.type === "dedouanement" && f.envoye_client);
                        return <DocRow label="Dédouanement" available={!!dd} />;
                      })()}

                      {/* Bon de livraison BL */}
                      {(() => {
                        const bl = quoteDocs?.delivery_notes?.find((b: any) => b.envoye_client);
                        return <DocRow label="Bon de livraison" available={!!bl} />;
                      })()}

                      <p style={{ fontSize: "10px", color: "#9CA3AF", textAlign: "center", margin: "10px 0 0" }}>
                        Les documents en attente seront disponibles quand notre équipe les aura préparés
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── POP-UP ACOMPTE ── */}
      {acompteQuote && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setAcompteQuote(null)}>
          <div
            style={{
              background: "#fff", borderRadius: "12px", padding: "24px", width: "400px", maxWidth: "90vw",
              maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Steps indicator */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{
                  flex: 1, height: "3px", borderRadius: "2px",
                  background: s <= acompteStep ? "#EA580C" : "#E5E7EB",
                }} />
              ))}
            </div>

            {/* STEP 1 — Montant */}
            {acompteStep === 1 && (() => {
              const { total, totalVerse, solde, acomptes: ac } = getAcompteInfo(acompteQuote);
              const nbEncaisses = ac.filter((a: any) => a.statut === "encaisse" || a.statut === "valide").length;
              const forceSolde = nbEncaisses >= 3;
              const montantForce = forceSolde ? solde : acompteMontant;
              return (
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
                    Étape 1 — Montant du virement
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Total devis</span>
                      <span style={{ fontWeight: 600 }}>{formatEur(total)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Déjà versé</span>
                      <span style={{ fontWeight: 600, color: "#059669" }}>{formatEur(totalVerse)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E5E7EB", paddingTop: "6px" }}>
                      <span style={{ fontWeight: 600, color: "#EA580C" }}>Solde restant</span>
                      <span style={{ fontWeight: 700, color: "#EA580C" }}>{formatEur(solde)}</span>
                    </div>
                  </div>

                  {/* Message 3ème acompte */}
                  {nbEncaisses >= 2 && nbEncaisses < 3 && (
                    <div style={{
                      background: "#FEF3C7", border: "0.5px solid #FCD34D", borderRadius: "6px",
                      padding: "8px 12px", fontSize: "11px", color: "#92400E", marginBottom: "8px",
                    }}>
                      ⚠️ Dernier acompte autorisé. Le prochain paiement devra solder la totalité du montant restant.
                    </div>
                  )}

                  {/* Message solde obligatoire (4ème+) */}
                  {forceSolde && (
                    <div style={{
                      background: "#FEF2F2", border: "0.5px solid #FECACA", borderRadius: "6px",
                      padding: "8px 12px", fontSize: "11px", color: "#991B1B", marginBottom: "8px",
                    }}>
                      ⛔ Paiement du solde obligatoire. Vous ne pouvez plus faire d'acompte partiel. Montant à payer : {formatEur(solde)}
                    </div>
                  )}

                  <label style={{ fontSize: "11px", color: "#6B7280", display: "block", marginBottom: "4px" }}>
                    Montant à virer (€)
                  </label>
                  <input
                    type="number"
                    value={forceSolde ? solde : acompteMontant}
                    onChange={(e) => !forceSolde && setAcompteMontant(Number(e.target.value))}
                    min={1} max={solde}
                    disabled={forceSolde}
                    style={{
                      width: "100%", padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px",
                      fontSize: "16px", fontWeight: 700, textAlign: "center", boxSizing: "border-box",
                      opacity: forceSolde ? 0.7 : 1, background: forceSolde ? "#F9FAFB" : "#fff",
                    }}
                  />
                  <button
                    onClick={() => { if (forceSolde) setAcompteMontant(solde); setAcompteStep(2); }}
                    disabled={montantForce <= 0 || montantForce > solde}
                    style={{
                      width: "100%", background: "#EA580C", color: "#fff", border: "none",
                      borderRadius: "6px", padding: "10px", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", marginTop: "12px", opacity: (montantForce <= 0 || montantForce > solde) ? 0.5 : 1,
                    }}
                  >
                    Continuer →
                  </button>
                </div>
              );
            })()}

            {/* STEP 2 — Type de compte */}
            {acompteStep === 2 && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
                  Étape 2 — Type de compte
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["perso", "pro"] as CompteType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => { setCompteType(t); setAcompteStep(3); }}
                      style={{
                        flex: 1, padding: "16px", border: `2px solid ${compteType === t ? "#EA580C" : "#E5E7EB"}`,
                        borderRadius: "8px", background: compteType === t ? "#FFF7ED" : "#fff",
                        cursor: "pointer", textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>{t === "perso" ? "👤" : "🏢"}</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>
                        {t === "perso" ? "Compte particulier" : "Compte professionnel"}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAcompteStep(1)}
                  style={{
                    width: "100%", background: "none", border: "1px solid #D1D5DB",
                    borderRadius: "6px", padding: "8px", fontSize: "12px", color: "#6B7280",
                    cursor: "pointer", marginTop: "12px",
                  }}
                >
                  ← Retour
                </button>
              </div>
            )}

            {/* STEP 3 — RIB */}
            {acompteStep === 3 && (() => {
              const ribKey = compteType === "pro" ? "rib_pro" : "rib_perso";
              const emKey = compteType === "pro" ? "emetteur_pro" : "emetteur_perso";
              const rib = adminParams[ribKey] || adminParams["rib"] || {};
              const emetteur = adminParams[emKey] || adminParams["emetteur"] || {};
              const ref = acompteQuote.numero_devis
                ? "FA" + acompteQuote.numero_devis.replace(/^D/, "")
                : `D${acompteQuote.id.slice(0, 8)}`;

              return (
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
                    Étape 3 — Coordonnées bancaires
                  </h3>
                  <div style={{
                    background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px",
                    padding: "14px", fontSize: "12px", marginBottom: "12px",
                  }}>
                    {emetteur.nom && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#6B7280", fontSize: "10px" }}>Bénéficiaire</span>
                        <p style={{ fontWeight: 600, color: "#111827", margin: "2px 0 0" }}>{emetteur.nom}</p>
                      </div>
                    )}
                    {rib.iban && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#6B7280", fontSize: "10px" }}>IBAN</span>
                        <p style={{ fontWeight: 600, color: "#111827", margin: "2px 0 0", fontFamily: "monospace", letterSpacing: "0.5px" }}>{rib.iban}</p>
                      </div>
                    )}
                    {rib.bic && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#6B7280", fontSize: "10px" }}>BIC</span>
                        <p style={{ fontWeight: 600, color: "#111827", margin: "2px 0 0", fontFamily: "monospace" }}>{rib.bic}</p>
                      </div>
                    )}
                    <div>
                      <span style={{ color: "#6B7280", fontSize: "10px" }}>Référence à indiquer</span>
                      <p style={{ fontWeight: 700, color: "#EA580C", margin: "2px 0 0", fontSize: "14px" }}>{ref}</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Montant à virer</span>
                      <span style={{ fontWeight: 700, color: "#EA580C" }}>{formatEur(acompteMontant)}</span>
                    </div>
                  </div>

                  {rib.pdf_url && (
                    <a
                      href={rib.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block", textAlign: "center", background: "#EFF6FF",
                        border: "1px solid #BFDBFE", borderRadius: "6px", padding: "8px",
                        color: "#1E3A5F", fontSize: "12px", fontWeight: 600,
                        textDecoration: "none", marginBottom: "8px",
                      }}
                    >
                      📄 Télécharger le RIB PDF
                    </a>
                  )}

                  <button
                    onClick={submitAcompte}
                    disabled={acompteSaving}
                    style={{
                      width: "100%", background: "#059669", color: "#fff", border: "none",
                      borderRadius: "6px", padding: "12px", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", opacity: acompteSaving ? 0.6 : 1,
                    }}
                  >
                    {acompteSaving ? "Enregistrement..." : "J'ai effectué le virement ✓"}
                  </button>

                  <button
                    onClick={() => setAcompteStep(2)}
                    style={{
                      width: "100%", background: "none", border: "1px solid #D1D5DB",
                      borderRadius: "6px", padding: "8px", fontSize: "12px", color: "#6B7280",
                      cursor: "pointer", marginTop: "6px",
                    }}
                  >
                    ← Retour
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
