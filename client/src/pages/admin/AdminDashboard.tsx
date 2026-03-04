import { useState, useEffect } from "react";
import { Package, FolderOpen, Users, TrendingUp, ShoppingCart, Activity } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  active?: boolean;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const totalProducts = products.length;
  const categories = [...new Set(products.map((p) => p.category))].length;
  const activeProducts = products.filter((p) => p.active !== false).length;

  const stats = [
    {
      label: "Total produits",
      value: loading ? "..." : totalProducts,
      icon: Package,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Catégories",
      value: loading ? "..." : categories,
      icon: FolderOpen,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "Produits actifs",
      value: loading ? "..." : activeProducts,
      icon: Activity,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "Utilisateurs",
      value: "---",
      icon: Users,
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
  ];

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bienvenue sur le panneau d'administration d'Import 97
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.lightColor} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#4A90D9]" />
            Actions rapides
          </h3>
          <div className="space-y-3">
            <a
              href="/admin/products"
              className="block w-full text-left px-4 py-3 rounded-xl bg-[#F5F5F5] hover:bg-gray-200 text-gray-700 transition-colors text-sm"
            >
              Gestion des produits
            </a>
            <a
              href="/admin/pricing"
              className="block w-full text-left px-4 py-3 rounded-xl bg-[#F5F5F5] hover:bg-gray-200 text-gray-700 transition-colors text-sm"
            >
              Modifier les prix des maisons
            </a>
            <a
              href="/admin/shipping"
              className="block w-full text-left px-4 py-3 rounded-xl bg-[#F5F5F5] hover:bg-gray-200 text-gray-700 transition-colors text-sm"
            >
              Tarifs de livraison
            </a>
            <a
              href="/admin/settings"
              className="block w-full text-left px-4 py-3 rounded-xl bg-[#F5F5F5] hover:bg-gray-200 text-gray-700 transition-colors text-sm"
            >
              Paramètres du site
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4A90D9]" />
            Informations
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Version du site</span>
              <span className="text-sm font-medium text-gray-800">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Dernière mise à jour</span>
              <span className="text-sm font-medium text-gray-800">
                {new Date().toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Statut</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                En ligne
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">Environnement</span>
              <span className="text-sm font-medium text-gray-800">Production</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
