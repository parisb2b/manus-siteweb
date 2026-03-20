import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { Loader2, RefreshCw, Plus, Pencil, Check, X, Users, ChevronDown, ChevronUp } from "lucide-react";

interface Partner {
  id: string;
  nom: string;
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
}

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Record<string, PartnerStats>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Partner>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newPartner, setNewPartner] = useState({ nom: "", email: "", telephone: "" });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data: pList } = await supabase
      .from("partners")
      .select("*")
      .order("created_at", { ascending: true });
    const list = (pList as Partner[]) ?? [];

    // Stats par partenaire depuis quotes
    const { data: quotesData } = await supabase
      .from("quotes")
      .select("partner_id, commission_montant, commission_payee")
      .not("partner_id", "is", null);

    const statsMap: Record<string, PartnerStats> = {};
    list.forEach((p) => {
      const rows = (quotesData || []).filter((q: any) => q.partner_id === p.id);
      statsMap[p.id] = {
        nb_devis: rows.length,
        total_commissions: rows.reduce((s: number, q: any) => s + (q.commission_montant ?? 0), 0),
        commissions_payees: rows.filter((q: any) => q.commission_payee).reduce((s: number, q: any) => s + (q.commission_montant ?? 0), 0),
      };
    });

    setPartners(list);
    setStats(statsMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const addPartner = async () => {
    if (!supabase || !newPartner.nom.trim()) return;
    setSaving("new");
    // Chercher user_id via email si fourni
    let user_id: string | undefined;
    if (newPartner.email) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newPartner.email.trim())
        .maybeSingle();
      user_id = prof?.id;
    }
    const { error } = await supabase.from("partners").insert({
      nom: newPartner.nom.trim(),
      email: newPartner.email.trim() || null,
      telephone: newPartner.telephone.trim() || null,
      user_id: user_id || null,
    });
    setSaving(null);
    if (error) { flash("err", "Erreur : " + error.message); return; }
    flash("ok", `Partenaire "${newPartner.nom}" ajouté`);
    setNewPartner({ nom: "", email: "", telephone: "" });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Partenaires</h2>
        <div className="flex gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input
                value={newPartner.nom}
                onChange={(e) => setNewPartner((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Nom du partenaire"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email (lier un compte)</label>
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
            const s = stats[p.id] ?? { nb_devis: 0, total_commissions: 0, commissions_payees: 0 };
            const isOpen = expandedId === p.id;
            const isEditing = editingId === p.id;
            const isAdmin = p.id === ADMIN_ID;

            return (
              <div key={p.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isAdmin ? "border-orange-200" : "border-gray-100"}`}>
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${isAdmin ? "bg-orange-500" : "bg-[#4A90D9]"}`}>
                      {p.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      {isEditing ? (
                        <div className="flex gap-2 items-center">
                          <input
                            value={editData.nom ?? p.nom}
                            onChange={(e) => setEditData((d) => ({ ...d, nom: e.target.value }))}
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
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
                            {isAdmin && <span className="ml-2 text-xs text-orange-500 font-normal">(par défaut)</span>}
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
                        <p className="text-xs text-gray-400">Payées</p>
                        <p className="font-bold text-emerald-600">{formatEur(s.commissions_payees)}</p>
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
                        {!isAdmin && (
                          <>
                            <button
                              onClick={() => { setEditingId(p.id); setEditData({ nom: p.nom, email: p.email, telephone: p.telephone }); }}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                    <PartnerDevis partnerId={p.id} />
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

function PartnerDevis({ partnerId }: { partnerId: string }) {
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    setLoading(true);
    supabase
      .from("quotes")
      .select("id, numero_devis, nom, email, prix_negocie, prix_total_calcule, commission_montant, commission_payee, statut, created_at")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDevis(data ?? []);
        setLoading(false);
      });
  }, [partnerId]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#4A90D9]" /></div>;
  if (devis.length === 0) return <p className="text-sm text-gray-400 py-2">Aucun devis attribué à ce partenaire.</p>;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" /> Devis attribués ({devis.length})
      </p>
      <div className="space-y-2">
        {devis.map((d) => (
          <div key={d.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 text-sm border border-gray-100">
            <div>
              <span className="font-semibold text-gray-700">{d.numero_devis || d.id.slice(0, 8)}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-600">{d.nom}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-orange-500">
                {d.commission_montant ? formatEur(d.commission_montant) : "—"}
              </span>
              {d.commission_payee ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Payée ✓</span>
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
