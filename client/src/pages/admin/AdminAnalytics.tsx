import { useState, useEffect } from "react";
import {
  BarChart3, FileText, Users, RefreshCw, TrendingUp, UserCheck, Activity,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabaseAdmin as supabase } from "@/lib/supabase";

interface DayPoint { date: string; devis: number; inscriptions: number; }
interface StatutCount { statut: string; count: number; }

const STATUT_COLORS: Record<string, string> = {
  nouveau: "text-blue-700 bg-blue-100",
  en_cours: "text-orange-700 bg-orange-100",
  negociation: "text-purple-700 bg-purple-100",
  accepte: "text-emerald-700 bg-emerald-100",
  refuse: "text-red-700 bg-red-100",
};

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau", en_cours: "En cours", negociation: "Négociation", accepte: "Accepté", refuse: "Refusé",
};

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

export default function AdminAnalytics() {
  const [chartData, setChartData] = useState<DayPoint[]>([]);
  const [statutCounts, setStatutCounts] = useState<StatutCount[]>([]);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState(0);
  const [newQuotesThisMonth, setNewQuotesThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);

    const timeout = setTimeout(() => { setLoading(false); setLoadError("Chargement trop long (timeout 8s)"); }, 8000);

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isoThirty = thirtyDaysAgo.toISOString();

      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);
      const isoMonth = firstOfMonth.toISOString();

      const [quotesRes, profilesRes, quotesMonthRes, usersMonthRes] = await Promise.all([
        supabase.from("quotes").select("created_at, statut").gte("created_at", isoThirty),
        supabase.from("profiles").select("created_at").gte("created_at", isoThirty),
        supabase.from("quotes").select("id").gte("created_at", isoMonth),
        supabase.from("profiles").select("id").gte("created_at", isoMonth),
      ]);

      const [allQuotes, allUsers] = await Promise.all([
        supabase.from("quotes").select("statut"),
        supabase.from("profiles").select("id"),
      ]);

      // Build chart data by day
      const dayMap: Record<string, DayPoint> = {};
      const last30: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = toDay(d.toISOString());
        dayMap[key] = { date: key.slice(5), devis: 0, inscriptions: 0 };
        last30.push(key);
      }
      (quotesRes.data ?? []).forEach((q: any) => {
        const k = toDay(q.created_at);
        if (dayMap[k]) dayMap[k].devis++;
      });
      (profilesRes.data ?? []).forEach((u: any) => {
        const k = toDay(u.created_at);
        if (dayMap[k]) dayMap[k].inscriptions++;
      });
      setChartData(last30.map((k) => dayMap[k]));

      // Statut counts
      const sc: Record<string, number> = {};
      (allQuotes.data ?? []).forEach((q: any) => { sc[q.statut] = (sc[q.statut] ?? 0) + 1; });
      setStatutCounts(Object.entries(sc).map(([statut, count]) => ({ statut, count })));
      setTotalQuotes(allQuotes.data?.length ?? 0);
      setTotalUsers(allUsers.data?.length ?? 0);
      setNewQuotesThisMonth(quotesMonthRes.data?.length ?? 0);
      setNewUsersThisMonth(usersMonthRes.data?.length ?? 0);
    } catch (err: any) {
      setLoadError(err.message ?? "Erreur inconnue lors du chargement des analytics");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="font-sans space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 mt-1">Statistiques en temps réel depuis Supabase</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {loadError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total devis", value: totalQuotes, icon: FileText, color: "bg-blue-50 text-blue-600" },
          { label: "Devis ce mois", value: newQuotesThisMonth, icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
          { label: "Total utilisateurs", value: totalUsers, icon: Users, color: "bg-emerald-50 text-emerald-600" },
          { label: "Inscrits ce mois", value: newUsersThisMonth, icon: UserCheck, color: "bg-purple-50 text-purple-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className={`p-3 rounded-xl w-fit mb-3 ${card.color.split(" ")[0]}`}>
                <Icon className={`w-5 h-5 ${card.color.split(" ")[1]}`} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{loading ? "…" : card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart — devis + inscriptions sur 30 jours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4A90D9]" />
          Activité sur 30 jours
        </h3>
        {loading ? (
          <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", fontSize: "13px" }} />
              <Legend />
              <Line type="monotone" dataKey="devis" stroke="#4A90D9" strokeWidth={2} dot={false} name="Devis" />
              <Line type="monotone" dataKey="inscriptions" stroke="#10B981" strokeWidth={2} dot={false} name="Inscriptions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Devis par statut */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#4A90D9]" />
          Devis par statut
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATUT_LABELS).map(([key, label]) => {
            const found = statutCounts.find((s) => s.statut === key);
            return (
              <div key={key} className="text-center bg-gray-50 rounded-xl p-3">
                <div className="text-2xl font-bold text-gray-800">{loading ? "…" : (found?.count ?? 0)}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[key] ?? "bg-gray-100 text-gray-600"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!supabase && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
          Supabase non configuré — les statistiques ne sont pas disponibles.
        </div>
      )}
    </div>
  );
}
