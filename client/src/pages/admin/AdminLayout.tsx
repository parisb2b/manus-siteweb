import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Home,
  Truck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  Navigation,
  Rocket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Eye,
  Image as ImageIcon,
  Layout,
  Inbox,
} from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminProducts from "./AdminProducts";
import AdminPricing from "./AdminPricing";
import AdminShipping from "./AdminShipping";
import AdminUsers from "./AdminUsers";
import AdminSettings from "./AdminSettings";
import AdminPages from "./AdminPages";
import AdminNavigation from "./AdminNavigation";
import AdminAnalytics from "./AdminAnalytics";
import AdminMedia from "./AdminMedia";
import AdminHeaderFooter from "./AdminHeaderFooter";
import AdminLeads from "./AdminLeads";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  component: React.ComponentType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", component: AdminDashboard },
  { label: "Produits", icon: Package, path: "/admin/products", component: AdminProducts },
  { label: "Pages", icon: FileText, path: "/admin/pages", component: AdminPages },
  { label: "Header & Footer", icon: Layout, path: "/admin/header-footer", component: AdminHeaderFooter },
  { label: "Navigation", icon: Navigation, path: "/admin/navigation", component: AdminNavigation },
  { label: "Médias", icon: ImageIcon, path: "/admin/media", component: AdminMedia },
  { label: "Prix Maisons", icon: Home, path: "/admin/pricing", component: AdminPricing },
  { label: "Livraison", icon: Truck, path: "/admin/shipping", component: AdminShipping },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics", component: AdminAnalytics },
  { label: "Contacts & Leads", icon: Inbox, path: "/admin/leads", component: AdminLeads },
  { label: "Utilisateurs", icon: Users, path: "/admin/users", component: AdminUsers },
  { label: "Paramètres", icon: Settings, path: "/admin/settings", component: AdminSettings },
];

export default function AdminLayout() {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "confirm" | "publishing" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_authenticated");
    if (isAuth !== "true") {
      setLocation("/admin");
    }
  }, [setLocation]);

  // Check for unpublished changes
  const checkPublishStatus = useCallback(() => {
    fetch("/api/publish-status")
      .then((res) => res.json())
      .then((data) => setHasChanges(data.hasChanges))
      .catch(() => {});
  }, []);

  useEffect(() => {
    checkPublishStatus();
    const interval = setInterval(checkPublishStatus, 10000);
    return () => clearInterval(interval);
  }, [checkPublishStatus]);

  const isAuthenticated = localStorage.getItem("admin_authenticated") === "true";
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    setLocation("/admin");
  };

  const handlePublish = async () => {
    setPublishState("publishing");
    try {
      const res = await fetch("/api/publish", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPublishState("success");
        setHasChanges(false);
        setTimeout(() => setPublishState("idle"), 3000);
      } else {
        setPublishError(data.error || "Erreur inconnue");
        setPublishState("error");
        setTimeout(() => setPublishState("idle"), 5000);
      }
    } catch (e) {
      setPublishError(String(e));
      setPublishState("error");
      setTimeout(() => setPublishState("idle"), 5000);
    }
  };

  const currentNav = navItems.find((item) => location === item.path) || navItems[0];
  const ActiveComponent = currentNav.component;

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] bg-[#1A1A2E] text-white z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-wide">97 import Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors duration-150 ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-150"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-[260px]">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-800 mr-3 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">{currentNav.label}</h2>
          </div>

          {/* Preview button */}
          <a
            href="/?preview=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm mr-3"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </a>

          {/* Publish button */}
          <div className="relative">
            {publishState === "idle" && (
              <button
                onClick={() => setPublishState("confirm")}
                className="relative inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Publier sur le site</span>
                <span className="sm:hidden">Publier</span>
                {hasChanges && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-bold text-white">!</span>
                  </span>
                )}
              </button>
            )}
            {publishState === "confirm" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">Publier sur 97import.com ?</span>
                <button
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmer
                </button>
                <button
                  onClick={() => setPublishState("idle")}
                  className="inline-flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
                >
                  Annuler
                </button>
              </div>
            )}
            {publishState === "publishing" && (
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-xl text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Publication en cours...
              </div>
            )}
            {publishState === "success" && (
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 font-semibold px-4 py-2 rounded-xl text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Site mis à jour !
              </div>
            )}
            {publishState === "error" && (
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-xl text-sm max-w-md truncate">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Erreur : {publishError}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
