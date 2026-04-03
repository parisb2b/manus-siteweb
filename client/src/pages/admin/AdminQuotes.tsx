import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Download, Search, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { adminQuery, adminUpdate } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatEur } from "@/utils/calculPrix";
import { getProduitPrincipal, getAcompteStatut, getAcompteMontant } from "@/lib/quoteHelpers";

// ── Types (colonnes réelles de la table quotes) ────────────
interface Quote {
  id: string;
  numero_devis: string;
  nom: string;
  email: string;
  telephone?: string;
  produits?: any;            // JSON array
  prix_total_calcule?: number;
  prix_negocie?: number;
  role_client?: string;
  statut: string;
  acomptes?: any;            // JSON array
  total_encaisse?: number;
  solde_restant?: number;
  partenaire_code?: string;
  created_at: string;
}

const STATUT_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "nouveau", label: "Nouveau" },
  { key: "en_cours", label: "En cours" },
  { key: "negociation", label: "Négociation" },
  { key: "accepte", label: "Accepté" },
  { key: "refuse", label: "Refusé" },
  { key: "non_conforme", label: "Non conforme" },
];

export default function AdminQuotes() {
  const [, setLocation] = useLocation();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const opts: any = {
      select: "id, numero_devis, nom, email, telephone, produits, prix_total_calcule, prix_negocie, role_client, statut, acomptes, total_encaisse, solde_restant, partenaire_code, created_at",
      order: { column: "created_at", ascending: false },
    };
    if (filter !== "all") {
      opts.eq = { statut: filter };
    }

    const result = await adminQuery<Quote>("quotes", opts);
    if (result.error) {
      setError(result.error);
    }
    setQuotes(result.data);
    setLoading(false);

    // Charger les counts par statut
    const countPromises = STATUT_FILTERS.filter((f) => f.key !== "all").map(async (f) => {
      const r = await adminQuery("quotes", { select: "id", eq: { statut: f.key } });
      return { key: f.key, count: r.count };
    });
    const results = await Promise.all(countPromises);
    const c: Record<string, number> = { all: 0 };
    results.forEach((r) => {
      c[r.key] = r.count;
      c.all += r.count;
    });
    setCounts(c);
  }, [filter]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Filtrer par recherche locale
  const filtered = search
    ? quotes.filter(
        (q) =>
          q.nom?.toLowerCase().includes(search.toLowerCase()) ||
          q.email?.toLowerCase().includes(search.toLowerCase()) ||
          q.numero_devis?.toLowerCase().includes(search.toLowerCase())
      )
    : quotes;

  // Actions — mise à jour acomptes via JSON
  const handleEncaisser = async (id: string, quote: Quote) => {
    // Mettre à jour le dernier acompte en_attente → encaisse dans le JSON
    const acompteList = getAcompteListRaw(quote.acomptes);
    const updated = acompteList.map((a: any) =>
      a.statut === "en_attente" || a.statut === "declare"
        ? { ...a, statut: "encaisse", date_encaissement: new Date().toISOString() }
        : a
    );
    const totalEncaisse = updated.reduce((s: number, a: any) => s + (a.montant || 0), 0);
    await adminUpdate("quotes", id, {
      acomptes: updated,
      total_encaisse: totalEncaisse,
      solde_restant: (quote.prix_total_calcule || 0) - totalEncaisse,
    });
    loadQuotes();
  };

  const handleNC = async (id: string) => {
    await adminUpdate("quotes", id, { statut: "non_conforme" });
    loadQuotes();
  };

  const handleReouvrir = async (id: string) => {
    await adminUpdate("quotes", id, { statut: "en_cours" });
    loadQuotes();
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["N°", "Client", "Email", "Produit", "Montant", "Statut", "Acompte", "Date"];
    const rows = quotes.map((q) => [
      q.numero_devis,
      q.nom,
      q.email,
      getProduitPrincipal(q.produits),
      q.prix_total_calcule || 0,
      q.statut,
      getAcompteStatut(q.acomptes),
      new Date(q.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devis-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Colonnes
  const columns: Column<Quote>[] = [
    {
      key: "numero_devis",
      label: "N°",
      className: "font-mono",
      render: (q) => (
        <span className="font-semibold text-[#1E3A5F]">{q.numero_devis || "—"}</span>
      ),
    },
    {
      key: "client",
      label: "Client",
      render: (q) => (
        <div>
          <div className="font-medium text-gray-800">{q.nom || "—"}</div>
          <div className="text-xs text-gray-400">{q.email}</div>
        </div>
      ),
    },
    {
      key: "produits",
      label: "Produit",
      render: (q) => (
        <span className="text-gray-600 truncate block max-w-[150px]">
          {getProduitPrincipal(q.produits)}
        </span>
      ),
    },
    {
      key: "prix_total_calcule",
      label: "Montant",
      className: "text-right",
      render: (q) => (
        <span className="font-semibold">
          {q.prix_total_calcule ? formatEur(q.prix_total_calcule) : "—"}
        </span>
      ),
    },
    {
      key: "acompte",
      label: "Acompte",
      render: (q) => {
        const statut = getAcompteStatut(q.acomptes);
        if (statut === "aucun") return null;
        const montant = getAcompteMontant(q.acomptes);
        const label = montant > 0 ? `${formatEur(montant)} ${statut === "declare" || statut === "en_attente" ? "déclaré" : "encaissé"}` : statut;
        return <AdminBadge status={statut === "declare" || statut === "en_attente" ? "acompte_declare" : "acompte_encaisse"} label={label} size="sm" />;
      },
    },
    {
      key: "statut",
      label: "Statut",
      render: (q) => <AdminBadge status={q.statut} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (q) => {
        const acompteStatut = getAcompteStatut(q.acomptes);
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {(acompteStatut === "declare" || acompteStatut === "en_attente") && acompteStatut !== "aucun" && (
              <button
                onClick={() => handleEncaisser(q.id, q)}
                title="Encaisser"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            {q.statut !== "non_conforme" && (
              <button
                onClick={() => handleNC(q.id)}
                title="Marquer NC"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            {q.statut === "non_conforme" && (
              <button
                onClick={() => handleReouvrir(q.id)}
                title="Réouvrir"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminPageLayout
      title="Devis & Facturation"
      subtitle={`${counts.all ?? quotes.length} devis — gestion complète`}
      onRefresh={loadQuotes}
      actions={
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#162d4a] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      }
    >
      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {STATUT_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f.key
                ? "bg-[#1E3A5F] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {counts[f.key] !== undefined && (
              <span className="ml-1.5 opacity-70">({counts[f.key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email ou n°..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none"
        />
      </div>

      {/* Tableau */}
      <AdminTable<Quote>
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        onRetry={loadQuotes}
        onRowClick={(q) => setLocation(`/admin/devis/${q.id}`)}
        emptyMessage="Aucun devis trouvé"
        pageSize={10}
        currentPage={page}
        onPageChange={setPage}
        totalCount={filtered.length}
      />
    </AdminPageLayout>
  );
}

// Helper interne pour extraire la liste brute des acomptes
function getAcompteListRaw(acomptes: any): any[] {
  try {
    const arr = typeof acomptes === 'string' ? JSON.parse(acomptes) : acomptes;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
