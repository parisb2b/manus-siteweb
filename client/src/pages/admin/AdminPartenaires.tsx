import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { prixPartenaire as calcPrixPartenaire } from "@/features/pricing/model/pricing";
import {
  Loader2, RefreshCw, Plus, Pencil, Check, X, Users,
  ChevronDown, ChevronUp, Download, Handshake,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton,
  SectionLabel, AdminInput,
} from "@/components/admin/AdminUI";

interface Partner {
  id: string;
  nom: string;
  code: string;
  email?: string;
  telephone?: string;
  user_id?: string;
  actif: boolean;
  created_at: string;
}

interface PartnerStats {
  nb_devis: number;
  total_commissions: number;
  commissions_payees: number;
  commissions_impayees: number;
}

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";

/** Génère un code 2 lettres à partir du nom (initiales) */
function generateCode(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nom.slice(0, 2).toUpperCase();
}

export default function AdminPartenaires() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [quotesData, setQuotesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Partner>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newPartner, setNewPartner] = useState({ nom: "", code: "", email: "", telephone: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: pList } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: true });
    setPartners((pList as Partner[]) ?? []);

    const { data: qData } = await supabase
      .from("quotes")
      .select("partner_id, commission_montant, commission_payee, numero_devis, nom, prix_negocie, prix_total_calcule, statut, created_at, produits")
      .not("partner_id", "is", null);
    setQuotesData(qData ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  /** Stats calculées par partenaire */
  const stats = useMemo(() => {
    const map: Record<string, PartnerStats> = {};
    partners.forEach((p) => {
      const rows = quotesData.filter((q: any) => q.partner_id === p.id);
      const total = rows.reduce((s: number, q: any) => s + (q.commission_montant ?? 0), 0);
      const payees = rows.filter((q: any) => q.commission_payee).reduce((s: number, q: any) => s + (q.commission_montant ?? 0), 0);
      map[p.id] = {
        nb_devis: rows.length,
        total_commissions: total,
        commissions_payees: payees,
        commissions_impayees: total - payees,
      };
    });
    return map;
  }, [partners, quotesData]);

  const addPartner = async () => {
    if (!supabase || !newPartner.nom.trim()) return;
    setSaving("new");
    let user_id: string | undefined;
    if (newPartner.email) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newPartner.email.trim())
        .maybeSingle();
      user_id = prof?.id;
    }
    const code = newPartner.code.trim() || generateCode(newPartner.nom);
    const { error } = await supabase.from("partners").insert({
      nom: newPartner.nom.trim(),
      code,
      email: newPartner.email.trim() || null,
      telephone: newPartner.telephone.trim() || null,
      user_id: user_id || null,
    });
    setSaving(null);
    if (error) { flash("err", "Erreur : " + error.message); return; }
    flash("ok", `Partenaire "${newPartner.nom}" ajouté (code: ${code})`);
    setNewPartner({ nom: "", code: "", email: "", telephone: "" });
    setShowAdd(false);
    await load();
  };

  const saveEdit = async (id: string) => {
    if (!supabase) return;
    setSaving(id);
    await supabase.from("partners").update(editData).eq("id", id);
    setSaving(null);
    setEditingId(null);
    setEditData({});
    flash("ok", "Partenaire mis à jour");
    await load();
  };

  const toggleActif = async (p: Partner) => {
    if (!supabase || p.id === ADMIN_ID) return;
    await supabase.from("partners").update({ actif: !p.actif }).eq("id", p.id);
    await load();
  };

  /** Export Excel commissions pour un partenaire */
  const exportCommissions = (p: Partner) => {
    const rows = quotesData.filter((q: any) => q.partner_id === p.id);
    if (!rows.length) { flash("err", "Aucun devis pour ce partenaire"); return; }

    const data = rows.map((q: any) => ({
      "N° Devis": q.numero_devis || q.id?.slice(0, 8),
      "Client": q.nom,
      "Date": new Date(q.created_at).toLocaleDateString("fr-FR"),
      "Statut": q.statut,
      "Prix négocié": q.prix_negocie ?? q.prix_total_calcule ?? 0,
      "Commission": q.commission_montant ?? 0,
      "Payée": q.commission_payee ? "Oui" : "Non",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commissions");
    XLSX.writeFile(wb, `Commissions_${p.code || p.nom}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    flash("ok", `Export Excel téléchargé pour ${p.nom}`);
  };

  /** Export Excel global toutes commissions */
  const exportAllCommissions = () => {
    const data = quotesData.map((q: any) => {
      const p = partners.find((pp) => pp.id === q.partner_id);
      return {
        "Code": p?.code ?? "—",
        "Partenaire": p?.nom ?? "—",
        "N° Devis": q.numero_devis || q.id?.slice(0, 8),
        "Client": q.nom,
        "Date": new Date(q.created_at).toLocaleDateString("fr-FR"),
        "Statut": q.statut,
        "Prix négocié": q.prix_negocie ?? q.prix_total_calcule ?? 0,
        "Commission": q.commission_montant ?? 0,
        "Payée": q.commission_payee ? "Oui" : "Non",
      };
    });

    if (!data.length) { flash("err", "Aucune commission"); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Toutes commissions");
    XLSX.writeFile(wb, `Commissions_Tous_${new Date().toISOString().slice(0, 10)}.xlsx`);
    flash("ok", "Export Excel global téléchargé");
  };

  // Totaux globaux
  const totaux = useMemo(() => {
    let total = 0, payees = 0;
    Object.values(stats).forEach((s) => {
      total += s.total_commissions;
      payees += s.commissions_payees;
    });
    return { total, payees, impayees: total - payees };
  }, [stats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.navy, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Handshake style={{ width: 22, height: 22, color: ADMIN_COLORS.orangeBtn }} /> Partenaires
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AdminButton variant="warning" size="sm" onClick={exportAllCommissions}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Download style={{ width: 14, height: 14 }} /> Export commissions
            </span>
          </AdminButton>
          <AdminButton variant="ghost" size="sm" onClick={load}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw style={{ width: 14, height: 14 }} /> Actualiser
            </span>
          </AdminButton>
          <AdminButton variant="primary" size="sm" onClick={() => setShowAdd((v) => !v)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus style={{ width: 14, height: 14 }} /> Ajouter
            </span>
          </AdminButton>
        </div>
      </div>

      {/* Résumé global */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <AdminCard style={{ padding: '14px' }}>
          <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: '0 0 4px' }}>Partenaires actifs</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>{partners.filter((p) => p.actif).length}</p>
        </AdminCard>
        <AdminCard style={{ padding: '14px' }}>
          <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: '0 0 4px' }}>Total devis</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.navyAccent, margin: 0 }}>{quotesData.length}</p>
        </AdminCard>
        <AdminCard style={{ padding: '14px' }}>
          <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: '0 0 4px' }}>Commissions totales</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.orangeBtn, margin: 0 }}>{formatEur(totaux.total)}</p>
        </AdminCard>
        <AdminCard style={{ padding: '14px' }}>
          <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: '0 0 4px' }}>Commissions impayées</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.redBtn, margin: 0 }}>{formatEur(totaux.impayees)}</p>
        </AdminCard>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 500,
          background: msg.type === "ok" ? ADMIN_COLORS.greenBg : ADMIN_COLORS.redBg,
          color: msg.type === "ok" ? ADMIN_COLORS.greenText : ADMIN_COLORS.redText,
          border: `0.5px solid ${msg.type === "ok" ? ADMIN_COLORS.greenBorder : ADMIN_COLORS.redBorder}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Formulaire ajout */}
      {showAdd && (
        <AdminCard style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: '0 0 12px' }}>Nouveau partenaire</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <AdminInput
              label="Nom *"
              value={newPartner.nom}
              onChange={(v) => {
                const nom = v;
                setNewPartner((p) => ({ ...p, nom, code: p.code || generateCode(nom) }));
              }}
              placeholder="Thomas Dupont"
            />
            <AdminInput
              label="Code (2 lettres)"
              value={newPartner.code}
              onChange={(v) => setNewPartner((p) => ({ ...p, code: v.toUpperCase().slice(0, 3) }))}
              placeholder="TD"
            />
            <AdminInput
              label="Email"
              value={newPartner.email}
              onChange={(v) => setNewPartner((p) => ({ ...p, email: v }))}
              placeholder="email@exemple.com"
            />
            <AdminInput
              label="Téléphone"
              value={newPartner.telephone}
              onChange={(v) => setNewPartner((p) => ({ ...p, telephone: v }))}
              placeholder="+33 6 …"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={addPartner}
              disabled={saving === "new" || !newPartner.nom.trim()}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {saving === "new" ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 14, height: 14 }} />}
                Ajouter
              </span>
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 style={{ width: 28, height: 28, color: ADMIN_COLORS.navyAccent, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {partners.map((p) => {
            const s = stats[p.id] ?? { nb_devis: 0, total_commissions: 0, commissions_payees: 0, commissions_impayees: 0 };
            const isOpen = expandedId === p.id;
            const isEditing = editingId === p.id;
            const isAdminPartner = p.id === ADMIN_ID;

            return (
              <AdminCard key={p.id} style={isAdminPartner ? { border: `0.5px solid ${ADMIN_COLORS.orangeBorder}` } : undefined}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Badge code */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '12px',
                      background: isAdminPartner ? ADMIN_COLORS.orangeBtn : p.actif ? ADMIN_COLORS.navyAccent : ADMIN_COLORS.grayText,
                    }}>
                      {p.code || p.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            value={editData.nom ?? p.nom}
                            onChange={(e) => setEditData((d) => ({ ...d, nom: e.target.value }))}
                            style={{ border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', width: 140, outline: 'none' }}
                          />
                          <input
                            value={editData.code ?? p.code ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, code: e.target.value.toUpperCase().slice(0, 3) }))}
                            placeholder="Code"
                            maxLength={3}
                            style={{ border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', width: 56, fontFamily: 'monospace', textTransform: 'uppercase' as const, outline: 'none' }}
                          />
                          <input
                            value={editData.email ?? p.email ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))}
                            placeholder="email"
                            style={{ border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', width: 160, outline: 'none' }}
                          />
                          <input
                            value={editData.telephone ?? p.telephone ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, telephone: e.target.value }))}
                            placeholder="téléphone"
                            style={{ border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', width: 120, outline: 'none' }}
                          />
                        </div>
                      ) : (
                        <>
                          <p style={{ fontWeight: 600, color: ADMIN_COLORS.navy, fontSize: '13px', margin: 0 }}>
                            {p.nom}
                            <span style={{
                              marginLeft: '8px', fontSize: '10px', fontFamily: 'monospace',
                              background: ADMIN_COLORS.grayBg, color: ADMIN_COLORS.grayTextDark,
                              padding: '2px 6px', borderRadius: '4px',
                            }}>{p.code}</span>
                            {isAdminPartner && <span style={{ marginLeft: '8px', fontSize: '10px', color: ADMIN_COLORS.orangeBtn, fontWeight: 400 }}>(direct)</span>}
                            {!p.actif && <span style={{ marginLeft: '8px', fontSize: '10px', color: ADMIN_COLORS.grayText, fontWeight: 400 }}>(inactif)</span>}
                          </p>
                          <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: '2px 0 0' }}>{p.email ?? "—"} {p.telephone ? `· ${p.telephone}` : ""}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Stats résumé */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', textAlign: 'right' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: 0 }}>Devis</p>
                        <p style={{ fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>{s.nb_devis}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: 0 }}>Commissions</p>
                        <p style={{ fontWeight: 700, color: ADMIN_COLORS.orangeText, margin: 0 }}>{formatEur(s.total_commissions)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: ADMIN_COLORS.grayText, margin: 0 }}>Impayées</p>
                        <p style={{ fontWeight: 700, color: ADMIN_COLORS.redText, margin: 0 }}>{formatEur(s.commissions_impayees)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <AdminButton variant="success" size="sm" onClick={() => saveEdit(p.id)} disabled={saving === p.id}>
                          {saving === p.id ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 14, height: 14 }} />}
                        </AdminButton>
                        <AdminButton variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditData({}); }}>
                          <X style={{ width: 14, height: 14 }} />
                        </AdminButton>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {!isAdminPartner && (
                          <>
                            <AdminButton variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setEditData({ nom: p.nom, code: p.code, email: p.email, telephone: p.telephone }); }}>
                              <Pencil style={{ width: 14, height: 14 }} />
                            </AdminButton>
                            <AdminButton
                              variant={p.actif ? "success" : "ghost"}
                              size="sm"
                              onClick={() => toggleActif(p)}
                            >
                              {p.actif ? "Actif" : "Inactif"}
                            </AdminButton>
                          </>
                        )}
                        <AdminButton variant="warning" size="sm" onClick={() => exportCommissions(p)}>
                          <Download style={{ width: 14, height: 14 }} />
                        </AdminButton>
                        <AdminButton variant="ghost" size="sm" onClick={() => setExpandedId(isOpen ? null : p.id)}>
                          {isOpen ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                        </AdminButton>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détail étendu */}
                {isOpen && (
                  <div style={{ borderTop: `0.5px solid ${ADMIN_COLORS.grayBorder}`, padding: '14px 18px', background: ADMIN_COLORS.grayBg }}>
                    <PartnerDevis partnerId={p.id} quotes={quotesData.filter((q: any) => q.partner_id === p.id)} />
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

function PartnerDevis({ partnerId, quotes }: { partnerId: string; quotes: any[] }) {
  if (quotes.length === 0) return <p style={{ fontSize: '12px', color: ADMIN_COLORS.grayText, padding: '8px 0' }}>Aucun devis attribué à ce partenaire.</p>;

  return (
    <div>
      <SectionLabel>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users style={{ width: 13, height: 13 }} /> Devis attribués ({quotes.length})
        </span>
      </SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {quotes.map((d: any) => (
          <AdminCard key={d.numero_devis || d.partner_id + d.created_at} style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <div>
                <span style={{ fontWeight: 600, color: ADMIN_COLORS.navy }}>{d.numero_devis || "—"}</span>
                <span style={{ color: ADMIN_COLORS.grayText, margin: '0 8px' }}>·</span>
                <span style={{ color: ADMIN_COLORS.grayTextDark }}>{d.nom}</span>
                <span style={{ color: ADMIN_COLORS.grayText, margin: '0 8px' }}>·</span>
                <span style={{ fontSize: '10px', color: ADMIN_COLORS.grayText }}>{new Date(d.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: ADMIN_COLORS.orangeText }}>
                  {d.commission_montant ? formatEur(d.commission_montant) : "—"}
                </span>
                {d.commission_payee ? (
                  <span style={{
                    fontSize: '9px', background: ADMIN_COLORS.greenBg, color: ADMIN_COLORS.greenText,
                    fontWeight: 500, padding: '2px 8px', borderRadius: '10px',
                    border: `0.5px solid ${ADMIN_COLORS.greenBorder}`,
                  }}>Payée</span>
                ) : (
                  <span style={{
                    fontSize: '9px', background: ADMIN_COLORS.orangeBg, color: ADMIN_COLORS.orangeText,
                    fontWeight: 500, padding: '2px 8px', borderRadius: '10px',
                    border: `0.5px solid ${ADMIN_COLORS.orangeBorder}`,
                  }}>En attente</span>
                )}
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
