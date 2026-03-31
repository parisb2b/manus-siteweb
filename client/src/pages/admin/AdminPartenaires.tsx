import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { prixPartenaire as calcPrixPartenaire } from "@/features/pricing/model/pricing";
import {
  Loader2, RefreshCw, Plus, Pencil, Check, X, Users,
  ChevronDown, ChevronUp, Download, Handshake,
} from "lucide-react";
import * as XLSX from "xlsx";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Handshake className="h-6 w-6 text-orange-500" /> Partenaires
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportAllCommissions} className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 px-3 py-1.5 bg-orange-50 rounded-lg">
            <Download className="h-4 w-4" /> Export commissions
          </button>
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4A90D9]">
            <RefreshCw className="h-4 w-4" /> Actualiser
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-2 text-sm bg-[#4A90D9] text-white px-3 py-1.5 rounded-lg hover:bg-[#3A7BC8] transition-colors"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Partenaires actifs</p>
          <p className="text-2xl font-bold text-gray-800">{partners.filter((p) => p.actif).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total devis</p>
          <p className="text-2xl font-bold text-[#4A90D9]">{quotesData.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Commissions totales</p>
          <p className="text-2xl font-bold text-orange-500">{formatEur(totaux.total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400">Commissions impayées</p>
          <p className="text-2xl font-bold text-red-500">{formatEur(totaux.impayees)}</p>
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Formulaire ajout */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-bold text-gray-700">Nouveau partenaire</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input
                value={newPartner.nom}
                onChange={(e) => {
                  const nom = e.target.value;
                  setNewPartner((p) => ({ ...p, nom, code: p.code || generateCode(nom) }));
                }}
                placeholder="Thomas Dupont"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Code (2 lettres)</label>
              <input
                value={newPartner.code}
                onChange={(e) => setNewPartner((p) => ({ ...p, code: e.target.value.toUpperCase().slice(0, 3) }))}
                placeholder="TD"
                maxLength={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                value={newPartner.email}
                onChange={(e) => setNewPartner((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemple.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input
                value={newPartner.telephone}
                onChange={(e) => setNewPartner((p) => ({ ...p, telephone: e.target.value }))}
                placeholder="+33 6 …"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-sm text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button
              onClick={addPartner}
              disabled={saving === "new" || !newPartner.nom.trim()}
              className="flex items-center gap-1.5 text-sm bg-[#4A90D9] text-white px-4 py-1.5 rounded-lg hover:bg-[#3A7BC8] disabled:opacity-50"
            >
              {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Ajouter
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" /></div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => {
            const s = stats[p.id] ?? { nb_devis: 0, total_commissions: 0, commissions_payees: 0, commissions_impayees: 0 };
            const isOpen = expandedId === p.id;
            const isEditing = editingId === p.id;
            const isAdminPartner = p.id === ADMIN_ID;

            return (
              <div key={p.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isAdminPartner ? "border-orange-200" : "border-gray-100"}`}>
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    {/* Badge code */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isAdminPartner ? "bg-orange-500" : p.actif ? "bg-[#4A90D9]" : "bg-gray-400"}`}>
                      {p.code || p.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      {isEditing ? (
                        <div className="flex gap-2 items-center flex-wrap">
                          <input
                            value={editData.nom ?? p.nom}
                            onChange={(e) => setEditData((d) => ({ ...d, nom: e.target.value }))}
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
                          />
                          <input
                            value={editData.code ?? p.code ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, code: e.target.value.toUpperCase().slice(0, 3) }))}
                            placeholder="Code"
                            maxLength={3}
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-16 font-mono uppercase"
                          />
                          <input
                            value={editData.email ?? p.email ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))}
                            placeholder="email"
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-40"
                          />
                          <input
                            value={editData.telephone ?? p.telephone ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, telephone: e.target.value }))}
                            placeholder="téléphone"
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-32"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-gray-800">
                            {p.nom}
                            <span className="ml-2 text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.code}</span>
                            {isAdminPartner && <span className="ml-2 text-xs text-orange-500 font-normal">(direct)</span>}
                            {!p.actif && <span className="ml-2 text-xs text-gray-400 font-normal">(inactif)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{p.email ?? "—"} {p.telephone ? `· ${p.telephone}` : ""}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats résumé */}
                    <div className="hidden sm:flex gap-4 text-sm text-right">
                      <div>
                        <p className="text-xs text-gray-400">Devis</p>
                        <p className="font-bold text-gray-700">{s.nb_devis}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Commissions</p>
                        <p className="font-bold text-orange-500">{formatEur(s.total_commissions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Impayées</p>
                        <p className="font-bold text-red-500">{formatEur(s.commissions_impayees)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(p.id)} disabled={saving === p.id} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                          {saving === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => { setEditingId(null); setEditData({}); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        {!isAdminPartner && (
                          <>
                            <button
                              onClick={() => { setEditingId(p.id); setEditData({ nom: p.nom, code: p.code, email: p.email, telephone: p.telephone }); }}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleActif(p)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${p.actif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {p.actif ? "Actif" : "Inactif"}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => exportCommissions(p)}
                          className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100"
                          title="Export Excel commissions"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button onClick={() => setExpandedId(isOpen ? null : p.id)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Détail étendu */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <PartnerDevis partnerId={p.id} quotes={quotesData.filter((q: any) => q.partner_id === p.id)} />
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

function PartnerDevis({ partnerId, quotes }: { partnerId: string; quotes: any[] }) {
  if (quotes.length === 0) return <p className="text-sm text-gray-400 py-2">Aucun devis attribué à ce partenaire.</p>;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" /> Devis attribués ({quotes.length})
      </p>
      <div className="space-y-2">
        {quotes.map((d: any) => (
          <div key={d.numero_devis || d.partner_id + d.created_at} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 text-sm border border-gray-100">
            <div>
              <span className="font-semibold text-gray-700">{d.numero_devis || "—"}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-600">{d.nom}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-orange-500">
                {d.commission_montant ? formatEur(d.commission_montant) : "—"}
              </span>
              {d.commission_payee ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Payée</span>
              ) : (
                <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">En attente</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
