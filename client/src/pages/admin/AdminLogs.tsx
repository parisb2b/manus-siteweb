import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, Check, HardDrive } from "lucide-react";
import { adminQuery, adminUpdate } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import type { LogType } from "@/lib/logger";
import { getLocalLogs } from "@/lib/logger";

interface ErrorLog {
  id: string;
  type: LogType;
  message: string;
  context: string;
  user_email: string;
  stack_trace?: string;
  resolved: boolean;
  created_at: string;
}

type FilterType = "all" | "unresolved" | LogType;

const TYPE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  email_error: { bg: "bg-orange-100", text: "text-orange-700", label: "Email" },
  api_error: { bg: "bg-red-100", text: "text-red-700", label: "API" },
  supabase_error: { bg: "bg-red-200", text: "text-red-800", label: "Supabase" },
  pdf_error: { bg: "bg-purple-100", text: "text-purple-700", label: "PDF" },
  auth_error: { bg: "bg-amber-100", text: "text-amber-700", label: "Auth" },
  unknown_error: { bg: "bg-gray-100", text: "text-gray-600", label: "Autre" },
};

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await adminQuery<ErrorLog>("error_logs", {
      select: "*",
      order: { column: "created_at", ascending: false },
      limit: 200,
    });
    if (result.error) {
      setError(result.error);
    }
    setLogs(result.data);
    setLoading(false);
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleResolve = async (id: string) => {
    const { error } = await adminUpdate("error_logs", id, { resolved: true });
    if (!error) {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: true } : l)));
      showToast("Marqué résolu");
    }
  };

  const handleResolveAll = async () => {
    const unresolved = logs.filter((l) => !l.resolved);
    if (unresolved.length === 0) return;
    for (const log of unresolved) {
      await adminUpdate("error_logs", log.id, { resolved: true });
    }
    setLogs((prev) => prev.map((l) => ({ ...l, resolved: true })));
    showToast(`${unresolved.length} erreurs marquées résolues`);
  };

  const handleRecupererLogsLocaux = () => {
    const localLogs = getLocalLogs();
    if (localLogs.length === 0) {
      showToast("Aucun log local trouvé");
      return;
    }
    const blob = new Blob([JSON.stringify(localLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-crash-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${localLogs.length} logs locaux exportés`);
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Message", "Contexte", "Utilisateur", "Résolu"];
    const rows = filteredLogs.map((l) => [
      new Date(l.created_at).toLocaleString("fr-FR"),
      l.type,
      `"${(l.message || "").replace(/"/g, '""')}"`,
      l.context,
      l.user_email,
      l.resolved ? "Oui" : "Non",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KPIs
  const today = new Date().toISOString().slice(0, 10);
  const errToday = logs.filter((l) => l.created_at.startsWith(today)).length;
  const errUnresolved = logs.filter((l) => !l.resolved).length;
  const errTotal = logs.length;

  // Filter
  const filteredLogs = logs.filter((l) => {
    if (filter === "all") return true;
    if (filter === "unresolved") return !l.resolved;
    return l.type === filter;
  });

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "unresolved", label: `Non résolues (${errUnresolved})` },
    { key: "email_error", label: "Email" },
    { key: "api_error", label: "API" },
    { key: "pdf_error", label: "PDF" },
    { key: "auth_error", label: "Auth" },
  ];

  const columns: Column<ErrorLog>[] = [
    {
      key: "type",
      label: "Type",
      render: (l) => {
        const badge = TYPE_BADGES[l.type] || TYPE_BADGES.unknown_error;
        return (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "message",
      label: "Message",
      render: (l) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-800 truncate" title={l.message}>
            {l.message || "—"}
          </p>
          {l.context && <p className="text-xs text-gray-400 truncate">{l.context}</p>}
        </div>
      ),
    },
    {
      key: "user_email",
      label: "Utilisateur",
      render: (l) => <span className="text-xs text-gray-500">{l.user_email || "—"}</span>,
    },
    {
      key: "created_at",
      label: "Date",
      render: (l) => (
        <span className="text-xs text-gray-500">
          {new Date(l.created_at).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "resolved",
      label: "Statut",
      render: (l) =>
        l.resolved ? (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Résolu
          </span>
        ) : (
          <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Actif
          </span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (l) =>
        !l.resolved ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResolve(l.id);
            }}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        ) : null,
    },
  ];

  return (
    <AdminPageLayout
      title="Journal des erreurs"
      onRefresh={fetchLogs}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleResolveAll}
            disabled={errUnresolved === 0}
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Tout résoudre
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleRecupererLogsLocaux}
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" /> Logs locaux
          </button>
        </div>
      }
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Erreurs aujourd'hui" value={errToday} color={errToday > 0 ? "text-red-500" : "text-gray-800"} />
        <KpiCard label="Non résolues" value={errUnresolved} color={errUnresolved > 0 ? "text-orange-500" : "text-emerald-500"} />
        <KpiCard label="Total erreurs" value={errTotal} color="text-gray-800" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              filter === f.key
                ? "bg-[#1E3A5F] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminTable<ErrorLog>
        columns={columns}
        data={filteredLogs}
        loading={loading}
        error={error}
        onRetry={fetchLogs}
        emptyMessage="Aucune erreur enregistrée"
        pageSize={15}
        currentPage={page}
        onPageChange={setPage}
        totalCount={filteredLogs.length}
      />
    </AdminPageLayout>
  );
}
