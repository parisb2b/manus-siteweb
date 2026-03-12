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
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  active?: boolean;
}

interface SiteContent {
  pagesConfig?: Record<string, { enabled: boolean; label: string }>;
  siteSettings?: Record<string, string>;
}

interface FoldersData {
  folders: Record<string, string[]>;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [totalImages, setTotalImages] = useState(0);
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");
  const [loading, setLoading] = useState(true);
  const [lastModified] = useState(new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }));

  const supabaseConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d)).catch(() => {}),
      fetch("/api/site-content").then((r) => r.json()).then((d) => setSiteContent(d)).catch(() => {}),
      fetch("/api/images").then((r) => r.json()).then((d: FoldersData) => {
        const count = Object.values(d.folders || {}).reduce((acc, arr) => acc + arr.length, 0);
        setTotalImages(count);
      }).catch(() => {}),
    ]).then(() => {
      setApiStatus("ok");
      setLoading(false);
    }).catch(() => {
      setApiStatus("error");
      setLoading(false);
    });
  }, []);

  const activeProducts = products.filter((p) => p.active !== false).length;
  const categories = Array.from(new Set(products.map((p) => p.category))).length;

  const enabledPages = siteContent?.pagesConfig
    ? Object.values(siteContent.pagesConfig).filter((p) => p.enabled).length
    : 0;

  const stats = [
    {
      label: "Produits actifs",
      value: loading ? "..." : activeProducts,
      total: loading ? "" : `/ ${products.length} total`,
      icon: Package,
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Pages activées",
      value: loading ? "..." : enabledPages,
      total: "",
      icon: FileText,
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Images",
      value: loading ? "..." : totalImages,
      total: "",
      icon: ImageIcon,
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Catégories",
      value: loading ? "..." : categories,
      total: "",
      icon: FolderOpen,
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
  ];

  const quickLinks = [
    { label: "Produits", desc: "Gérer le catalogue", icon: Package, path: "/admin/products" },
    { label: "Pages", desc: "Activer / désactiver", icon: FileText, path: "/admin/pages" },
    { label: "Header & Footer", desc: "Logos, couleurs, liens", icon: Layout, path: "/admin/header-footer" },
    { label: "Navigation", desc: "Menu du site", icon: Navigation, path: "/admin/navigation" },
    { label: "Médias", desc: "Images & galerie", icon: ImageIcon, path: "/admin/media" },
    { label: "Prix Maisons", desc: "Configurer les tailles", icon: Home, path: "/admin/pricing" },
    { label: "Livraison", desc: "Tarifs DOM-TOM", icon: Truck, path: "/admin/shipping" },
    { label: "Analytics", desc: "Statistiques de visite", icon: BarChart3, path: "/admin/analytics" },
    { label: "Contacts & Leads", desc: supabaseConfigured ? "Voir les messages" : "Configuration requise", icon: Inbox, path: "/admin/leads" },
    { label: "Utilisateurs", desc: "Comptes clients", icon: Users, path: "/admin/users" },
    { label: "Paramètres", desc: "Config avancée", icon: Settings, path: "/admin/settings" },
  ];

  const guideSteps = [
    { step: "1", title: "Modifier un produit", desc: "Aller dans Produits → cliquer sur un produit → modifier → Sauvegarder." },
    { step: "2", title: "Changer le logo", desc: "Aller dans Header & Footer → onglet Header → téléverser un nouveau logo." },
    { step: "3", title: "Ajouter une image", desc: "Aller dans Médias → choisir un dossier → glisser-déposer l'image." },
    { step: "4", title: "Activer/désactiver une page", desc: "Aller dans Pages → basculer l'interrupteur de la page souhaitée." },
    { step: "5", title: "Publier les modifications", desc: "Cliquer sur le bouton vert 'Publier sur le site' en haut à droite." },
  ];

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bienvenue sur le panneau d'administration de 97 import
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <div className={`${stat.lightColor} p-3 rounded-xl w-fit mb-3`}>
                <Icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {stat.value}
                {stat.total && <span className="text-sm font-normal text-gray-400 ml-1">{stat.total}</span>}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick links */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        {/* System status + info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4A90D9]" />
              Statut du système
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">API locale</span>
                {apiStatus === "checking" ? (
                  <span className="text-gray-400 text-xs">Vérification...</span>
                ) : apiStatus === "ok" ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Opérationnelle
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Erreur
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Données</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" /> {loading ? "Chargement..." : "OK"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Supabase</span>
                {supabaseConfigured ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Configuré
                  </span>
                ) : (
                  <span className="text-amber-600 text-xs font-medium">Non configuré</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Dernière modif.
                </span>
                <span className="text-xs text-gray-500">{lastModified}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#4A90D9]/5 border border-[#4A90D9]/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#4A90D9] uppercase tracking-wider mb-2">Rappel important</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Toute modification doit être publiée via le bouton <strong>"Publier sur le site"</strong> pour être visible par les visiteurs.
            </p>
          </div>
        </div>
      </div>

      {/* Guide d'utilisation rapide */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#4A90D9]" />
          Guide d'utilisation rapide — 5 actions essentielles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {guideSteps.map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#4A90D9] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-0.5">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
