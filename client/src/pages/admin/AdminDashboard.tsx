import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FileText, Users, DollarSign, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { adminQuery } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatEur } from "@/utils/calculPrix";
import { getProduitPrincipal, getAcompteStatut } from "@/lib/quoteHelpers";

// ── KPI Card ───────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  error,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  error?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${error ? "text-gray-300" : "text-gray-800"}`}>
          {error ? "—" : value}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [kpis, setKpis] = useState({
    devisEnCours: 0,
    acompteDeclares: 0,
    clientsActifs: 0,
    caTotal: "0 €",
  });
  const [kpiErrors, setKpiErrors] = useState<Record<string, boolean>>({});
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const errors: Record<string, boolean> = {};

    // KPI 1 — Devis en cours
    const q1 = await adminQuery("quotes", {
      select: "id",
      inValues: { column: "statut", values: ["nouveau", "en_cours", "negociation"] },
    });
    if (q1.error) errors.devisEnCours = true;

    // KPI 2 — Acomptes déclarés (on filtre côté client depuis le JSON acomptes)
    const q2 = await adminQuery<{ acomptes: any }>("quotes", {
      select: "id, acomptes",
    });
    const acompteDeclares = q2.error ? 0 : q2.data.filter(
      (q) => getAcompteStatut(q.acomptes) === "declare" || getAcompteStatut(q.acomptes) === "en_attente"
    ).length;
    if (q2.error) errors.acompteDeclares = true;

    // KPI 3 — Clients actifs
    const q3 = await adminQuery("profiles", {
      select: "id",
      neq: { role: "admin" },
    });
    if (q3.error) errors.clientsActifs = true;

    // KPI 4 — CA total (devis acceptés)
    const q4 = await adminQuery<{ prix_total_calcule: number }>("quotes", {
      select: "prix_total_calcule",
      eq: { statut: "accepte" },
    });
    if (q4.error) errors.caTotal = true;
    const ca = q4.data.reduce((sum, q) => sum + (q.prix_total_calcule || 0), 0);

    setKpis({
      devisEnCours: q1.count,
      acompteDeclares,
      clientsActifs: q3.count,
      caTotal: formatEur(ca),
    });
    setKpiErrors(errors);

    // Derniers devis
    const recent = await adminQuery("quotes", {
      select: "id, numero_devis, nom, email, produits, prix_total_calcule, statut, created_at",
      order: { column: "created_at", ascending: false },
      limit: 5,
    });
    if (recent.error) setError(recent.error);
    setRecentQuotes(recent.data);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminPageLayout title="Tableau de bord" onRefresh={loadData}>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Clock}
          label="Devis en cours"
          value={kpis.devisEnCours}
          color="bg-blue-500"
          error={kpiErrors.devisEnCours}
        />
        <KpiCard
          icon={DollarSign}
          label="Acomptes déclarés"
          value={kpis.acompteDeclares}
          color="bg-orange-500"
          error={kpiErrors.acompteDeclares}
        />
        <KpiCard
          icon={Users}
          label="Clients actifs"
          value={kpis.clientsActifs}
          color="bg-emerald-500"
          error={kpiErrors.clientsActifs}
        />
        <KpiCard
          icon={DollarSign}
          label="CA total (acceptés)"
          value={kpis.caTotal}
          color="bg-purple-500"
          error={kpiErrors.caTotal}
        />
      </div>

      {/* Derniers devis */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Derniers devis</h2>
          <button
            onClick={() => setLocation("/admin/devis")}
            className="text-sm text-[#4A90D9] hover:text-[#357ABD] font-medium inline-flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="px-5 py-3 bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs font-medium">
              <th className="px-5 py-2.5">N°</th>
              <th className="px-5 py-2.5">Client</th>
              <th className="px-5 py-2.5">Produit</th>
              <th className="px-5 py-2.5 text-right">Montant</th>
              <th className="px-5 py-2.5">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : recentQuotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setLocation(`/admin/devis/${q.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-[#1E3A5F]">
                      {q.numero_devis || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-800">{q.nom || "—"}</div>
                      <div className="text-xs text-gray-400">{q.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]">
                      {getProduitPrincipal(q.produits)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {q.prix_total_calcule ? formatEur(q.prix_total_calcule) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge status={q.statut || "nouveau"} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </AdminPageLayout>
  );
}
