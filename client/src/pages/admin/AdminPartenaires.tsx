import { useState, useEffect, useCallback } from "react";
import { Handshake, DollarSign, FileText, Users, ToggleLeft, ToggleRight, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { adminQuery, adminUpdate } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";
import { formatEur } from "@/utils/calculPrix";

// Colonnes réelles de la table partners
interface Partner {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  user_id?: string;
  actif: boolean;
  created_at: string;
  // enrichi côté client depuis quotes
  total_devis?: number;
  total_commissions?: number;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
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
      </div>
    </div>
  );
}

export default function AdminPartenaires() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await adminQuery<Partner>("partners", {
      select: "id, nom, email, telephone, user_id, actif, created_at",
      order: { column: "created_at", ascending: false },
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Enrichir avec les données de devis (commissions depuis quotes)
    const enriched = await Promise.all(
      result.data.map(async (p) => {
        const qResult = await adminQuery<{
          prix_total_calcule: number;
          commission_montant: number;
          commission_payee: boolean;
        }>("quotes", {
          select: "id, prix_total_calcule, commission_montant, commission_payee",
          eq: { partenaire_id: p.id },
        });
        const totalDevis = qResult.count;
        const totalCommissions = qResult.data.reduce(
          (sum, q) => sum + (q.commission_montant || 0),
          0
        );
        return {
          ...p,
          total_devis: totalDevis,
          total_commissions: totalCommissions,
        };
      })
    );

    setPartners(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const toggleActif = async (id: string, currentActif: boolean) => {
    const { error } = await adminUpdate("partners", id, { actif: !currentActif });
    if (!error) {
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, actif: !currentActif } : p))
      );
    }
  };

  const handleExportExcel = () => {
    const rows = partners.map((p) => ({
      "Nom": p.nom,
      "Email": p.email || "—",
      "Téléphone": p.telephone || "—",
      "Statut": p.actif ? "Actif" : "Inactif",
      "Nb devis": p.total_devis || 0,
      "Commission totale (€)": p.total_commissions || 0,
      "Date création": new Date(p.created_at).toLocaleDateString("fr-FR"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 10 },
      { wch: 10 }, { wch: 20 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Partenaires");
    XLSX.writeFile(wb, `partenaires-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const actifs = partners.filter((p) => p.actif).length;
  const totalDevis = partners.reduce((s, p) => s + (p.total_devis || 0), 0);
  const totalComm = partners.reduce((s, p) => s + (p.total_commissions || 0), 0);

  const columns: Column<Partner>[] = [
    {
      key: "nom",
      label: "Nom",
      render: (p) => (
        <div>
          <div className="font-medium text-gray-800">{p.nom}</div>
          <div className="text-xs text-gray-400">{p.email}</div>
        </div>
      ),
    },
    {
      key: "telephone",
      label: "Téléphone",
      render: (p) => <span className="text-gray-600">{p.telephone || "—"}</span>,
    },
    {
      key: "total_devis",
      label: "Devis",
      className: "text-center",
      render: (p) => <span className="font-semibold">{p.total_devis || 0}</span>,
    },
    {
      key: "total_commissions",
      label: "Commissions",
      className: "text-right",
      render: (p) => (
        <span className="font-semibold">{formatEur(p.total_commissions || 0)}</span>
      ),
    },
    {
      key: "actif",
      label: "Statut",
      render: (p) => <AdminBadge status={p.actif ? "actif" : "inactif"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleActif(p.id, p.actif)}
            title={p.actif ? "Désactiver" : "Activer"}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {p.actif ? (
              <ToggleRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Partenaires"
      onRefresh={loadPartners}
      actions={
        <button
          onClick={handleExportExcel}
          disabled={partners.length === 0}
          className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> Export Excel
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Handshake} label="Partenaires actifs" value={actifs} color="bg-blue-500" />
        <KpiCard icon={FileText} label="Total devis" value={totalDevis} color="bg-emerald-500" />
        <KpiCard icon={DollarSign} label="Commissions totales" value={formatEur(totalComm)} color="bg-purple-500" />
        <KpiCard icon={Users} label="Total partenaires" value={partners.length} color="bg-gray-500" />
      </div>

      <AdminTable<Partner>
        columns={columns}
        data={partners}
        loading={loading}
        error={error}
        onRetry={loadPartners}
        emptyMessage="Aucun partenaire enregistré"
        pageSize={10}
        currentPage={page}
        onPageChange={setPage}
        totalCount={partners.length}
      />
    </AdminPageLayout>
  );
}
