import { useState, useEffect, useCallback } from "react";
import { TrendingUp, ShoppingCart, Users, DollarSign, Package } from "lucide-react";
import { adminQuery } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import { formatEur } from "@/utils/calculPrix";
import { getProduitPrincipal } from "@/lib/quoteHelpers";

interface QuoteStat {
  id: string;
  statut: string;
  prix_total_calcule?: number;
  total_encaisse?: number;
  produits?: any;
  created_at: string;
  email: string;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [quotes, setQuotes] = useState<QuoteStat[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [quotesRes, profilesRes] = await Promise.all([
        adminQuery<QuoteStat>("quotes", {
          select: "id, statut, prix_total_calcule, total_encaisse, produits, created_at, email",
          order: { column: "created_at", ascending: false },
        }),
        adminQuery<{ id: string }>("profiles", {
          select: "id",
          neq: { role: "admin" },
        }),
      ]);

      if (quotesRes.error) {
        setError(quotesRes.error);
      } else {
        setQuotes(quotesRes.data);
      }
      setClientCount(profilesRes.count);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPI calculations
  const totalDevis = quotes.length;
  const devisAcceptes = quotes.filter((q) => q.statut === "accepte");
  const caTotal = devisAcceptes.reduce((s, q) => s + (q.prix_total_calcule || 0), 0);
  const totalEncaisse = quotes.reduce((s, q) => s + (q.total_encaisse || 0), 0);
  const tauxConversion = totalDevis > 0 ? Math.round((devisAcceptes.length / totalDevis) * 100) : 0;

  // Top produits
  const produitCountMap = new Map<string, number>();
  for (const q of quotes) {
    const nom = getProduitPrincipal(q.produits);
    if (nom && nom !== "Produit non défini") {
      produitCountMap.set(nom, (produitCountMap.get(nom) || 0) + 1);
    }
  }
  const topProduits = [...produitCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Devis par mois (6 derniers mois)
  const now = new Date();
  const monthStats: { label: string; count: number; ca: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthQuotes = quotes.filter((q) => {
      const qd = new Date(q.created_at);
      return qd.getMonth() === month && qd.getFullYear() === year;
    });
    monthStats.push({
      label,
      count: monthQuotes.length,
      ca: monthQuotes
        .filter((q) => q.statut === "accepte")
        .reduce((s, q) => s + (q.prix_total_calcule || 0), 0),
    });
  }
  const maxCount = Math.max(...monthStats.map((m) => m.count), 1);

  if (loading) {
    return (
      <AdminPageLayout title="Analytics" onRefresh={loadData}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </AdminPageLayout>
    );
  }

  if (error) {
    return (
      <AdminPageLayout title="Analytics" onRefresh={loadData}>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
          {error}
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout title="Analytics" onRefresh={loadData}>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="CA total (acceptés)"
          value={formatEur(caTotal)}
          sub={`${devisAcceptes.length} devis acceptés`}
          color="bg-emerald-500"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Total devis"
          value={totalDevis}
          sub={`Taux de conversion : ${tauxConversion}%`}
          color="bg-blue-500"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total encaissé"
          value={formatEur(totalEncaisse)}
          sub={caTotal > 0 ? `${Math.round((totalEncaisse / caTotal) * 100)}% du CA` : "—"}
          color="bg-purple-500"
        />
        <KpiCard
          icon={Users}
          label="Clients inscrits"
          value={clientCount}
          color="bg-gray-500"
        />
      </div>

      {/* Graphe + Top produits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Devis par mois — bar chart simple */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Devis par mois</h3>
          <div className="flex items-end gap-2 h-40">
            {monthStats.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-gray-700">{m.count}</span>
                <div
                  className="w-full bg-[#4A90D9] rounded-t-lg transition-all"
                  style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: m.count > 0 ? 8 : 2 }}
                />
                <span className="text-[10px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top produits demandés</h3>
          {topProduits.length === 0 && (
            <p className="text-sm text-gray-400">Aucune donnée</p>
          )}
          <div className="space-y-3">
            {topProduits.map(([nom, count], i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{nom}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-[#4A90D9] h-1.5 rounded-full"
                      style={{ width: `${(count / (topProduits[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CA par mois */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">CA mensuel (devis acceptés)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="py-2 px-3">Mois</th>
                <th className="py-2 px-3 text-center">Devis</th>
                <th className="py-2 px-3 text-right">CA accepté</th>
              </tr>
            </thead>
            <tbody>
              {monthStats.map((m, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-700">{m.label}</td>
                  <td className="py-2.5 px-3 text-center">{m.count}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{formatEur(m.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageLayout>
  );
}
