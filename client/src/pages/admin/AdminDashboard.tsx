import { useState, useEffect } from "react";
import {
  Package,
  FolderOpen,
  Activity,
  Image as ImageIcon,
  Users,
  Layout,
  Navigation,
  Home,
  Truck,
  Settings,
  FileText,
  BarChart3,
  Inbox,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ADMIN_COLORS,
  AdminCard,
  AdminCardHeader,
  AdminButton,
  BadgeStatut,
  SectionLabel,
} from "@/components/admin/AdminUI";

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négociation",
  accepte: "Accepté",
  refuse: "Refusé",
};

const STATUT_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  nouveau:     { bg: ADMIN_COLORS.infoBg,    color: ADMIN_COLORS.infoBtn },
  en_cours:    { bg: ADMIN_COLORS.orangeBg,  color: ADMIN_COLORS.orangeBtn },
  negociation: { bg: ADMIN_COLORS.purpleBg,  color: ADMIN_COLORS.purpleBtn },
  accepte:     { bg: ADMIN_COLORS.greenBg,   color: ADMIN_COLORS.greenBtn },
  refuse:      { bg: ADMIN_COLORS.redBg,     color: ADMIN_COLORS.redBtn },
};

const ROLE_BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  user:          { bg: ADMIN_COLORS.grayBg,    color: ADMIN_COLORS.grayText },
  vip:           { bg: ADMIN_COLORS.purpleBg,  color: ADMIN_COLORS.purpleBtn },
  partner:       { bg: ADMIN_COLORS.orangeBg,  color: ADMIN_COLORS.orangeBtn },
  collaborateur: { bg: ADMIN_COLORS.infoBg,    color: ADMIN_COLORS.infoBtn },
  admin:         { bg: ADMIN_COLORS.redBg,     color: ADMIN_COLORS.redBtn },
};

interface QuoteRow { id: string; nom: string; email: string; statut: string; created_at: string; prix_total_calcule?: number; }
interface UserRow { id: string; first_name: string; last_name: string; email: string; role: string; created_at: string; }

export default function AdminDashboard() {
  const [quotesByStatut, setQuotesByStatut] = useState<Record<string, number>>({});
  const [usersByRole, setUsersByRole] = useState<Record<string, number>>({});
  const [lastQuotes, setLastQuotes] = useState<QuoteRow[]>([]);
  const [lastUsers, setLastUsers] = useState<UserRow[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  useEffect(() => {
    if (!supabase) { setSupabaseLoading(false); return; }
    Promise.all([
      supabase.from("quotes").select("statut").then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((q: any) => { counts[q.statut] = (counts[q.statut] ?? 0) + 1; });
        setQuotesByStatut(counts);
      }),
      supabase.from("profiles").select("role").then(({ data }) => {
        const counts: Record<string, number> = {};
        (data ?? []).forEach((u: any) => { counts[u.role] = (counts[u.role] ?? 0) + 1; });
        setUsersByRole(counts);
      }),
      supabase.from("quotes").select("id,nom,email,statut,created_at,prix_total_calcule").order("created_at", { ascending: false }).limit(5).then(({ data }) => setLastQuotes((data as QuoteRow[]) ?? [])),
      supabase.from("profiles").select("id,first_name,last_name,email,role,created_at").order("created_at", { ascending: false }).limit(5).then(({ data }) => setLastUsers((data as UserRow[]) ?? [])),
    ]).finally(() => setSupabaseLoading(false));
  }, []);

  const totalQuotes = Object.values(quotesByStatut).reduce((a, b) => a + b, 0);
  const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0);

  const quickLinks = [
    { label: "Produits", desc: "Gérer le catalogue", icon: Package, path: "/admin/products" },
    { label: "Devis", desc: "Gérer les devis", icon: FileText, path: "/admin/quotes" },
    { label: "Utilisateurs", desc: "Comptes clients", icon: Users, path: "/admin/users" },
    { label: "Pages", desc: "Activer / désactiver", icon: FileText, path: "/admin/pages" },
    { label: "Header & Footer", desc: "Logos, couleurs, liens", icon: Layout, path: "/admin/header-footer" },
    { label: "Navigation", desc: "Menu du site", icon: Navigation, path: "/admin/navigation" },
    { label: "Médias", desc: "Images & galerie", icon: ImageIcon, path: "/admin/media" },
    { label: "Prix Maisons", desc: "Configurer les tailles", icon: Home, path: "/admin/pricing" },
    { label: "Livraison", desc: "Tarifs DOM-TOM", icon: Truck, path: "/admin/shipping" },
    { label: "Analytics", desc: "Statistiques de visite", icon: BarChart3, path: "/admin/analytics" },
    { label: "Contacts & Leads", desc: "Voir les messages", icon: Inbox, path: "/admin/leads" },
    { label: "Paramètres", desc: "Config avancée", icon: Settings, path: "/admin/settings" },
  ];

  const inlineBadge = (text: string, colors: { bg: string; color: string }) => (
    <span style={{
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 10px',
      borderRadius: '12px',
      background: colors.bg,
      color: colors.color,
      textTransform: 'capitalize' as const,
    }}>
      {text}
    </span>
  );

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>Dashboard</h1>
        <p style={{ color: ADMIN_COLORS.grayText, marginTop: '4px', fontSize: '14px' }}>
          Bienvenue sur le panneau d'administration de 97 import
        </p>
      </div>

      {/* ── Supabase stats ── */}
      {supabaseConfigured && (
        <>
          {/* Devis par statut */}
          <AdminCard>
            <AdminCardHeader>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare style={{ width: 16, height: 16 }} />
                Devis — {supabaseLoading ? "..." : totalQuotes} total
              </span>
            </AdminCardHeader>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
              {Object.entries(STATUT_LABELS).map(([key, label]) => (
                <div key={key} style={{
                  textAlign: 'center',
                  background: ADMIN_COLORS.grayBg,
                  borderRadius: '12px',
                  padding: '12px',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: ADMIN_COLORS.navy }}>
                    {supabaseLoading ? "..." : (quotesByStatut[key] ?? 0)}
                  </div>
                  <BadgeStatut statut={key} />
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Utilisateurs par rôle */}
          <AdminCard>
            <AdminCardHeader>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck style={{ width: 16, height: 16 }} />
                Utilisateurs — {supabaseLoading ? "..." : totalUsers} total
              </span>
            </AdminCardHeader>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
              {(["user", "vip", "partner", "collaborateur", "admin"] as const).map((role) => {
                const colors = ROLE_BADGE_COLORS[role] ?? { bg: ADMIN_COLORS.grayBg, color: ADMIN_COLORS.grayText };
                return (
                  <div key={role} style={{
                    textAlign: 'center',
                    background: ADMIN_COLORS.grayBg,
                    borderRadius: '12px',
                    padding: '12px',
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: ADMIN_COLORS.navy }}>
                      {supabaseLoading ? "..." : (usersByRole[role] ?? 0)}
                    </div>
                    {inlineBadge(role, colors)}
                  </div>
                );
              })}
            </div>
          </AdminCard>

          {/* Last 5 devis + last 5 users */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Last quotes */}
            <AdminCard>
              <AdminCardHeader>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText style={{ width: 16, height: 16 }} />
                  Derniers devis
                </span>
              </AdminCardHeader>
              <div style={{ padding: '16px' }}>
                {supabaseLoading ? (
                  <p style={{ fontSize: '13px', color: ADMIN_COLORS.grayText }}>Chargement...</p>
                ) : lastQuotes.length === 0 ? (
                  <p style={{ fontSize: '13px', color: ADMIN_COLORS.grayText }}>Aucun devis</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lastQuotes.map((q) => (
                      <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div>
                          <p style={{ fontWeight: 500, color: ADMIN_COLORS.navy, margin: 0 }}>{q.nom}</p>
                          <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: 0 }}>{q.email}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <BadgeStatut statut={q.statut} />
                          <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: '4px 0 0' }}>
                            {new Date(q.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AdminCard>

            {/* Last users */}
            <AdminCard>
              <AdminCardHeader>
                <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users style={{ width: 16, height: 16 }} />
                  Derniers inscrits
                </span>
              </AdminCardHeader>
              <div style={{ padding: '16px' }}>
                {supabaseLoading ? (
                  <p style={{ fontSize: '13px', color: ADMIN_COLORS.grayText }}>Chargement...</p>
                ) : lastUsers.length === 0 ? (
                  <p style={{ fontSize: '13px', color: ADMIN_COLORS.grayText }}>Aucun utilisateur</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lastUsers.map((u) => {
                      const colors = ROLE_BADGE_COLORS[u.role] ?? { bg: ADMIN_COLORS.grayBg, color: ADMIN_COLORS.grayText };
                      return (
                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <div>
                            <p style={{ fontWeight: 500, color: ADMIN_COLORS.navy, margin: 0 }}>
                              {u.first_name} {u.last_name} {!u.first_name && !u.last_name && <span style={{ color: ADMIN_COLORS.grayText }}>—</span>}
                            </p>
                            <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: 0 }}>{u.email}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {inlineBadge(u.role, colors)}
                            <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: '4px 0 0' }}>
                              {new Date(u.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </AdminCard>
          </div>
        </>
      )}

      {/* Quick links */}
      <AdminCard>
        <AdminCardHeader>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ width: 16, height: 16 }} />
            Accès rapides
          </span>
        </AdminCardHeader>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '4px' }}>
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.path}
                href={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = ADMIN_COLORS.navyLight; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{
                  background: ADMIN_COLORS.grayBg,
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon style={{ width: 16, height: 16, color: ADMIN_COLORS.navyAccent }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: ADMIN_COLORS.navy, margin: 0 }}>{link.label}</p>
                  <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.desc}</p>
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: ADMIN_COLORS.grayBorder, flexShrink: 0 }} />
              </a>
            );
          })}
        </div>
      </AdminCard>

      {/* System status */}
      <AdminCard>
        <AdminCardHeader>
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Statut du système
          </span>
        </AdminCardHeader>
        <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: ADMIN_COLORS.grayText }}>Déploiement</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ADMIN_COLORS.greenText, fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, background: ADMIN_COLORS.greenBtn, borderRadius: '50%', display: 'inline-block' }} />
              Vercel SPA
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: ADMIN_COLORS.grayText }}>Supabase</span>
            {supabaseConfigured ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ADMIN_COLORS.greenText, fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, background: ADMIN_COLORS.greenBtn, borderRadius: '50%', display: 'inline-block' }} />
                Configuré
              </span>
            ) : (
              <span style={{ color: ADMIN_COLORS.orangeText, fontSize: '12px', fontWeight: 500 }}>Non configuré</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: ADMIN_COLORS.grayText, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock style={{ width: 14, height: 14 }} /> Heure
            </span>
            <span style={{ fontSize: '12px', color: ADMIN_COLORS.grayTextDark }}>
              {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
