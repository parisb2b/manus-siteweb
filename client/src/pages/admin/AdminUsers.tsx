import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Save, RefreshCw } from "lucide-react";
import { ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton } from "@/components/admin/AdminUI";

type Role = "user" | "vip" | "partner" | "collaborateur" | "admin";

const ROLE_STYLE: Record<Role, { bg: string; border: string; text: string }> = {
  user:          { bg: ADMIN_COLORS.grayBg,    border: ADMIN_COLORS.grayBorder,   text: ADMIN_COLORS.grayTextDark },
  vip:           { bg: ADMIN_COLORS.purpleBg,   border: ADMIN_COLORS.purpleBorder, text: ADMIN_COLORS.purpleText },
  partner:       { bg: ADMIN_COLORS.orangeBg,   border: ADMIN_COLORS.orangeBorder, text: ADMIN_COLORS.orangeText },
  collaborateur: { bg: ADMIN_COLORS.infoBg,     border: ADMIN_COLORS.infoBorder,   text: ADMIN_COLORS.infoText },
  admin:         { bg: ADMIN_COLORS.redBg,      border: ADMIN_COLORS.redBorder,    text: ADMIN_COLORS.redText },
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

  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) {
      setLoadError("Connexion Supabase indisponible.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setLoadError(`Erreur de chargement : ${error.message} (code ${error.code})`);
      setUsers([]);
    } else if (!data || data.length === 0) {
      setLoadError("Aucun profil trouvé. Vérifiez que la table profiles est accessible et que les RLS policies autorisent la lecture admin.");
      setUsers([]);
    } else {
      // If direct query returns 0 or 1 result, try RPC fallback
      if (!data || data.length <= 1) {
        const { data: rpcData } = await supabase.rpc('get_all_profiles');
        if (rpcData && rpcData.length > (data?.length ?? 0)) {
          setUsers(rpcData as UserRecord[]);
          setLoading(false);
          return;
        }
      }
      setUsers(data as UserRecord[]);
    }
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

    // Auto-insert into partners table when role is set to 'partner'
    const ed = edits[id];
    if (ed?.role === 'partner') {
      const user = users.find(u => u.id === id);
      if (user) {
        await supabase.from('partners').upsert({
          user_id: user.id,
          nom: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          code: (user.first_name || user.email).substring(0, 2).toUpperCase(),
          email: user.email,
          actif: true,
        }, { onConflict: 'user_id' });
      }
    }

    setSaving(null);
    setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    await load();
  };

  const countByRole: Record<string, number> = {};
  users.forEach((u) => { countByRole[u.role] = (countByRole[u.role] ?? 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>
          Gestion Utilisateurs
        </h2>
        <AdminButton variant="ghost" size="sm" onClick={load}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw style={{ width: 14, height: 14 }} /> Actualiser
          </span>
        </AdminButton>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => {
          const rs = ROLE_STYLE[r];
          return (
            <AdminCard key={r}>
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: ADMIN_COLORS.navy }}>
                  {countByRole[r] ?? 0}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  padding: '2px 10px', borderRadius: '12px',
                  background: rs.bg, color: rs.text,
                  border: `0.5px solid ${rs.border}`,
                }}>
                  {ROLE_LABELS[r]}
                </span>
              </div>
            </AdminCard>
          );
        })}
      </div>

      {/* Filtres + Recherche */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 auto', maxWidth: '320px' }}>
          <Search style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, color: ADMIN_COLORS.grayText,
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email ou nom..."
            style={{
              width: '100%', paddingLeft: '32px', paddingRight: '10px',
              paddingTop: '7px', paddingBottom: '7px',
              border: `0.5px solid ${ADMIN_COLORS.navyBorder}`,
              borderRadius: '6px', fontSize: '12px', outline: 'none',
              background: '#fff', color: ADMIN_COLORS.navy,
              boxSizing: 'border-box' as const,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(["tous", ...Object.keys(ROLE_LABELS)] as const).map((r) => {
            const active = filterRole === r;
            return (
              <button
                key={r}
                onClick={() => setFilterRole(r as any)}
                style={{
                  padding: '4px 12px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                  border: active ? 'none' : `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                  background: active ? ADMIN_COLORS.navy : ADMIN_COLORS.grayBg,
                  color: active ? '#fff' : ADMIN_COLORS.grayTextDark,
                  transition: 'all 0.15s',
                }}
              >
                {r === "tous" ? "Tous" : ROLE_LABELS[r as Role]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {loadError && (
        <div style={{
          background: ADMIN_COLORS.redBg, border: `1px solid ${ADMIN_COLORS.redBorder}`,
          borderRadius: '8px', padding: '14px 18px',
        }}>
          <p style={{ fontWeight: 600, fontSize: '13px', color: ADMIN_COLORS.redText, margin: '0 0 4px' }}>
            ⚠ Problème de chargement
          </p>
          <p style={{ fontSize: '12px', color: ADMIN_COLORS.redText, margin: 0 }}>{loadError}</p>
          <button
            onClick={load}
            style={{
              marginTop: '8px', fontSize: '11px', fontWeight: 700,
              color: ADMIN_COLORS.redBtn, background: 'transparent',
              border: 'none', cursor: 'pointer', textDecoration: 'underline',
              padding: 0,
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 style={{ width: 32, height: 32, color: ADMIN_COLORS.navyAccent, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <AdminCard>
          <AdminCardHeader>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
              Liste des utilisateurs
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </AdminCardHeader>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: ADMIN_COLORS.navyLight, borderBottom: `1px solid ${ADMIN_COLORS.navyBorder}` }}>
                  {['Nom', 'Email', 'Rôle', 'Prix négocié (€)', 'Inscrit le', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: '10px', fontWeight: 600, color: ADMIN_COLORS.navy,
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const ed = edits[u.id] ?? {};
                  const currentRole = (ed.role ?? u.role) as Role;
                  const rs = ROLE_STYLE[currentRole];
                  return (
                    <tr key={u.id} style={{
                      borderBottom: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
                      background: idx % 2 === 0 ? '#fff' : ADMIN_COLORS.grayBg,
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: ADMIN_COLORS.navy }}>
                        {u.first_name} {u.last_name}
                        {!u.first_name && !u.last_name && <span style={{ color: ADMIN_COLORS.grayText }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: ADMIN_COLORS.grayTextDark }}>{u.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={currentRole}
                          onChange={(e) => patch(u.id, "role", e.target.value)}
                          style={{
                            padding: '3px 8px', borderRadius: '12px',
                            fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                            border: `0.5px solid ${rs.border}`,
                            background: rs.bg, color: rs.text,
                            outline: 'none',
                          }}
                        >
                          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {(currentRole === "vip") && (
                          <input
                            type="number"
                            placeholder="Prix €"
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              patch(u.id, "prix_negocie", val ? { default: val } : null);
                            }}
                            style={{
                              width: '80px', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`,
                              borderRadius: '4px', padding: '4px 8px', fontSize: '11px',
                              outline: 'none', background: '#fff', color: ADMIN_COLORS.navy,
                            }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: ADMIN_COLORS.grayText, fontSize: '11px' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {edits[u.id] && (
                          <AdminButton variant="primary" size="sm" onClick={() => save(u.id)} disabled={saving === u.id}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {saving === u.id
                                ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                                : <Save style={{ width: 12, height: 12 }} />}
                              Sauv.
                            </span>
                          </AdminButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '10px 14px', background: ADMIN_COLORS.grayBg,
            borderTop: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
          }}>
            <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: 0 }}>
              {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
