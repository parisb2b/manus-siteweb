import { useState, useEffect } from "react";
import {
  BarChart3,
  Eye,
  ShoppingCart,
  FileText,
  Trash2,
  Activity,
  TrendingUp,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DailyChartPoint {
  date: string;
  visits: number;
}

interface TopProduct {
  name: string;
  views: number;
  cartAdds: number;
}

interface TopPage {
  path: string;
  views: number;
}

interface AnalyticsEvent {
  type: string;
  timestamp: string;
  data?: Record<string, any>;
}

interface AnalyticsSummary {
  today: {
    visitors: number;
    pageViews: number;
    cartAdds: number;
    quoteRequests: number;
  };
  dailyChart: DailyChartPoint[];
  topProducts: TopProduct[];
  topPages: TopPage[];
  recentEvents: AnalyticsEvent[];
  funnel: {
    visitors: number;
    cart: number;
    quotes: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function describeEvent(ev: AnalyticsEvent): string {
  switch (ev.type) {
    case "page_view":
      return `🔍 Visite de page: ${ev.data?.path ?? "/"}`;
    case "product_view":
      return `👁 Consultation: ${ev.data?.productName ?? "Produit"}`;
    case "add_to_cart":
      return `🛒 Ajout au panier: ${ev.data?.productName ?? "Produit"}`;
    case "quote_request":
      return "📋 Demande de devis";
    case "auth_login":
      return "🔑 Connexion";
    case "language_switch":
      return `🌐 Changement de langue${ev.data?.lang ? ` → ${ev.data.lang}` : ""}`;
    default:
      return `📌 ${ev.type}`;
  }
}

function pct(part: number, total: number): string {
  if (total === 0) return "0 %";
  return `${((part / total) * 100).toFixed(1)} %`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch("/api/analytics/summary")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: AnalyticsSummary) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Erreur inconnue");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = async () => {
    if (!confirm("Voulez-vous vraiment réinitialiser toutes les données analytics ?")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/analytics/reset", { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchData();
    } catch (err: any) {
      alert("Erreur lors de la réinitialisation : " + (err.message ?? ""));
    } finally {
      setResetting(false);
    }
  };

  /* ---------- Stat cards config ---------- */
  const statCards = summary
    ? [
        {
          label: "Visiteurs aujourd'hui",
          value: summary.today.visitors,
          icon: Users,
          lightColor: "bg-blue-50",
          textColor: "text-blue-600",
        },
        {
          label: "Pages vues",
          value: summary.today.pageViews,
          icon: Eye,
          lightColor: "bg-purple-50",
          textColor: "text-purple-600",
        },
        {
          label: "Ajouts panier",
          value: summary.today.cartAdds,
          icon: ShoppingCart,
          lightColor: "bg-emerald-50",
          textColor: "text-emerald-600",
        },
        {
          label: "Demandes devis",
          value: summary.today.quoteRequests,
          icon: FileText,
          lightColor: "bg-amber-50",
          textColor: "text-amber-600",
        },
      ]
    : [];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Statistiques et comportement des visiteurs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && !summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          Chargement des données analytics...
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6 mb-6 text-red-700 text-sm">
          Impossible de charger les analytics : {error}
        </div>
      )}

      {summary && (
        <>
          {/* ===================== STAT CARDS ===================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${card.lightColor} p-3 rounded-xl`}>
                      <Icon className={`w-6 h-6 ${card.textColor}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* =================== CHART + FUNNEL =================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
            {/* Line chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#4A90D9]" />
                Visites sur 7 jours
              </h3>
              {summary.dailyChart && summary.dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={summary.dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E5E7EB",
                        fontSize: "13px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visits"
                      stroke="#4A90D9"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#4A90D9", stroke: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#4A90D9" }}
                      name="Visites"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>

            {/* Conversion funnel */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#4A90D9]" />
                Entonnoir de conversion
              </h3>
              <div className="space-y-5">
                {/* Visitors */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Visiteurs</span>
                    <span className="text-sm font-bold text-gray-800">
                      {summary.funnel.visitors}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4A90D9]"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">100 %</p>
                </div>

                {/* Cart */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Panier</span>
                    <span className="text-sm font-bold text-gray-800">
                      {summary.funnel.cart}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width:
                          summary.funnel.visitors > 0
                            ? `${(summary.funnel.cart / summary.funnel.visitors) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {pct(summary.funnel.cart, summary.funnel.visitors)}
                  </p>
                </div>

                {/* Quotes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Devis</span>
                    <span className="text-sm font-bold text-gray-800">
                      {summary.funnel.quotes}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width:
                          summary.funnel.visitors > 0
                            ? `${(summary.funnel.quotes / summary.funnel.visitors) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {pct(summary.funnel.quotes, summary.funnel.visitors)}
                  </p>
                </div>
              </div>

              {/* Funnel arrow labels */}
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Visiteurs → Panier</span>
                  <span className="font-semibold text-gray-700">
                    {pct(summary.funnel.cart, summary.funnel.visitors)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Panier → Devis</span>
                  <span className="font-semibold text-gray-700">
                    {pct(summary.funnel.quotes, summary.funnel.cart)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Visiteurs → Devis</span>
                  <span className="font-semibold text-gray-700">
                    {pct(summary.funnel.quotes, summary.funnel.visitors)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================ TOP PRODUCTS + TOP PAGES ================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            {/* Top 10 Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#4A90D9]" />
                  Top 10 Produits
                </h3>
              </div>
              {summary.topProducts && summary.topProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-semibold text-gray-600">
                          Produit
                        </th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-600">
                          Vues
                        </th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-600">
                          Ajouts panier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.topProducts.slice(0, 10).map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-800">
                            {p.name}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-600">
                            {p.views}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-600">
                            {p.cartAdds}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-gray-400 text-sm">
                  Aucun produit consulté
                </div>
              )}
            </div>

            {/* Top Pages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#4A90D9]" />
                  Pages les plus visitées
                </h3>
              </div>
              {summary.topPages && summary.topPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-semibold text-gray-600">
                          Page
                        </th>
                        <th className="text-right px-6 py-3 font-semibold text-gray-600">
                          Vues
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.topPages.map((page, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-gray-800 text-xs">
                            {page.path}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-600">
                            {page.views}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-gray-400 text-sm">
                  Aucune page visitée
                </div>
              )}
            </div>
          </div>

          {/* ================ RECENT EVENTS ================ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#4A90D9]" />
                Événements récents
              </h3>
            </div>
            {summary.recentEvents && summary.recentEvents.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {summary.recentEvents.slice(0, 20).map((ev, i) => (
                  <li
                    key={i}
                    className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{describeEvent(ev)}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatTimestamp(ev.timestamp)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-10 text-center text-gray-400 text-sm">
                Aucun événement enregistré
              </div>
            )}
            {summary.recentEvents && summary.recentEvents.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  {Math.min(summary.recentEvents.length, 20)} dernier
                  {summary.recentEvents.length > 1 ? "s" : ""} événement
                  {summary.recentEvents.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
