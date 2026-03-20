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

const STATUT_COLORS: Record<string, string> = {
  nouveau: "bg-blue-100 text-blue-700",
  en_cours: "bg-orange-100 text-orange-700",
  negociation: "bg-purple-100 text-purple-700",
  accepte: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négociation",
  accepte: "Accepté",
  refuse: "Refusé",
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-gray-100 text-gray-600",
  vip: "bg-purple-100 text-purple-700",
  partner: "bg-orange-100 text-orange-700",
  collaborateur: "bg-blue-100 text-blue-700",
  admin: "bg-red-100 text-red-700",
};

interface QuoteRow { id: string; nom: string; email: string; statut: string; created_at: string; prix_total_calcule?: number; }
interface UserRow { id: string; first_name: string; last_name: string; email: string; role: string; created_at: string; }

export default function AdminDashboard() {
  const [quotesByStatut, setQuotesByStatut] = useState<Record<string, number>>({});
  const [usersByRole, setUsersByRole] = useState<Record<string, number>>({});
  const [lastQuotes, setLastQuotes] = useState<QuoteRow[]>([]);
  const [lastUsers, setLastUsers] = useState<UserRow[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");

  const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  useEffect(() => {
    fetch("/api/products").then(() => setApiStatus("ok")).catch(() => setApiStatus("error"));
  }, []);

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

  return (
    <div className="font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bienvenue sur le panneau d'administration de 97 import</p>
      </div>

      {/* ── Supabase stats ── */}
      {supabaseConfigured && (
        <>
          {/* Devis par statut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#4A90D9]" />
              Devis — {supabaseLoading ? "..." : totalQuotes} total
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(STATUT_LABELS).map(([key, label]) => (
                <div key={key} className="text-center bg-gray-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-gray-800">{supabaseLoading ? "…" : (quotesByStatut[key] ?? 0)}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[key]}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Utilisateurs par rôle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#4A90D9]" />
              Utilisateurs — {supabaseLoading ? "..." : totalUsers} total
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(["user", "vip", "partner", "collaborateur", "admin"] as const).map((role) => (
                <div key={role} className="text-center bg-gray-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-gray-800">{supabaseLoading ? "…" : (usersByRole[role] ?? 0)}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[role]}`}>{role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Last 5 devis + last 5 users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Last quotes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4A90D9]" />
                Derniers devis
              </h3>
              {supabaseLoading ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : lastQuotes.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun devis</p>
              ) : (
                <ul className="space-y-2">
                  {lastQuotes.map((q) => (
                    <li key={q.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{q.nom}</p>
                        <p className="text-xs text-gray-400">{q.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[q.statut] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUT_LABELS[q.statut] ?? q.statut}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(q.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Last users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4A90D9]" />
                Derniers inscrits
              </h3>
              {supabaseLoading ? (
                <p className="text-sm text-gray-400">Chargement...</p>
              ) : lastUsers.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun utilisateur</p>
              ) : (
                <ul className="space-y-2">
                  {lastUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{u.first_name} {u.last_name} {!u.first_name && !u.last_name && <span className="text-gray-400">—</span>}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(u.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* Quick links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4A90D9]" />
          Accès rapides
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.path}
                href={link.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="bg-gray-100 group-hover:bg-[#4A90D9]/10 p-2 rounded-lg transition-colors">
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#4A90D9] transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-[#4A90D9] transition-colors">{link.label}</p>
                  <p className="text-xs text-gray-400 truncate">{link.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-[#4A90D9] transition-colors flex-shrink-0" />
              </a>
            );
          })}
        </div>
      </div>

      {/* System status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#4A90D9]" />
          Statut du système
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">API locale</span>
            {apiStatus === "checking" ? (
              <span className="text-gray-400 text-xs">Vérification...</span>
            ) : apiStatus === "ok" ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> OK</span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-600 font-medium"><AlertCircle className="w-3.5 h-3.5" /> Erreur</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Supabase</span>
            {supabaseConfigured ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Configuré</span>
            ) : (
              <span className="text-amber-600 text-xs font-medium">Non configuré</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Heure</span>
            <span className="text-xs text-gray-500">{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
