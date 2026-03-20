import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Save, RefreshCw } from "lucide-react";

type Role = "user" | "vip" | "partner" | "collaborateur" | "admin";

const ROLE_COLORS: Record<Role, string> = {
  user: "bg-gray-100 text-gray-600",
  vip: "bg-purple-100 text-purple-700",
  partner: "bg-orange-100 text-orange-700",
  collaborateur: "bg-blue-100 text-blue-700",
  admin: "bg-red-100 text-red-700",
};

const ROLE_LABELS: Record<Role, string> = {
  user: "Utilisateur",
  vip: "VIP",
  partner: "Partenaire",
  collaborateur: "Collaborateur",
  admin: "Admin",
};

interface UserRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: Role;
  created_at: string;
  app_metadata?: { provider?: string };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "tous">("tous");
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<UserRecord>>>({});

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as UserRecord[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "tous" || u.role === filterRole;
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.first_name + " " + u.last_name).toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const patch = (id: string, field: string, val: any) =>
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: val } }));

  const save = async (id: string) => {
    if (!supabase || !edits[id]) return;
    setSaving(id);
    await supabase.from("profiles").update(edits[id]).eq("id", id);
    setSaving(null);
    setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    await load();
  };

  const countByRole: Record<string, number> = {};
  users.forEach((u) => { countByRole[u.role] = (countByRole[u.role] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestion Utilisateurs</h2>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#4A90D9]">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <div key={r} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <div className="text-2xl font-bold text-gray-800">{countByRole[r] ?? 0}</div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[r]}`}>
              {ROLE_LABELS[r]}
            </span>
          </div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email ou nom…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["tous", ...Object.keys(ROLE_LABELS)] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterRole === r ? "bg-[#4A90D9] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r === "tous" ? "Tous" : ROLE_LABELS[r as Role]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-500">Nom</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Email</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Rôle</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Prix négocié (€)</th>
                  <th className="px-5 py-3 font-semibold text-gray-500">Inscrit le</th>
                  <th className="px-5 py-3 font-semibold text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => {
                  const ed = edits[u.id] ?? {};
                  const currentRole = (ed.role ?? u.role) as Role;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {u.first_name} {u.last_name}
                        {!u.first_name && !u.last_name && <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <select
                          value={currentRole}
                          onChange={(e) => patch(u.id, "role", e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-[#4A90D9] cursor-pointer ${ROLE_COLORS[currentRole] ?? ROLE_COLORS.user}`}
                        >
                          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        {(currentRole === "vip") && (
                          <input
                            type="number"
                            placeholder="Prix €"
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              patch(u.id, "prix_negocie", val ? { default: val } : null);
                            }}
                            className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
                          />
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {edits[u.id] && (
                          <button
                            onClick={() => save(u.id)}
                            disabled={saving === u.id}
                            className="flex items-center gap-1.5 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            {saving === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Sauv.
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}
