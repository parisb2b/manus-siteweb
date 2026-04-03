import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Users, Search, ArrowUpCircle } from "lucide-react";
import { adminQuery, adminUpdate } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import AdminBadge from "@/components/admin/AdminBadge";

interface UserProfile {
  id: string;
  email: string;
  nom?: string;
  prenom?: string;
  role: string;
  ile?: string;
  telephone?: string;
  created_at: string;
  quotes_count?: number;
  last_quote_date?: string;
}

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await adminQuery<UserProfile>("profiles", {
      select: "id, email, nom, prenom, role, ile, telephone, created_at",
      order: { column: "created_at", ascending: false },
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Enrichir avec les infos devis (count + dernière date)
    const enriched = await Promise.all(
      result.data.map(async (u) => {
        const qResult = await adminQuery("quotes", {
          select: "id, created_at",
          eq: { email: u.email },
          order: { column: "created_at", ascending: false },
          limit: 1,
        });
        return {
          ...u,
          quotes_count: qResult.count,
          last_quote_date: qResult.data[0]?.created_at || null,
        };
      })
    );

    setUsers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpgradeVIP = async (id: string) => {
    const { error } = await adminUpdate("profiles", id, { role: "vip" });
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: "vip" } : u))
      );
    }
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.nom?.toLowerCase().includes(search.toLowerCase()) ||
          u.prenom?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const columns: Column<UserProfile>[] = [
    {
      key: "nom",
      label: "Nom",
      render: (u) => (
        <div>
          <div className="font-medium text-gray-800">
            {[u.prenom, u.nom].filter(Boolean).join(" ") || "—"}
          </div>
          <div className="text-xs text-gray-400">{u.email}</div>
        </div>
      ),
    },
    {
      key: "ile",
      label: "Île",
      render: (u) => <span className="text-gray-600">{u.ile || "—"}</span>,
    },
    {
      key: "role",
      label: "Rôle",
      render: (u) => <AdminBadge status={u.role || "user"} />,
    },
    {
      key: "quotes_count",
      label: "Devis",
      className: "text-center",
      render: (u) => (
        <span className="font-semibold text-gray-700">{u.quotes_count || 0}</span>
      ),
    },
    {
      key: "last_quote",
      label: "Dernier devis",
      render: (u) =>
        u.last_quote_date ? (
          <span className="text-sm text-gray-500">
            {new Date(u.last_quote_date).toLocaleDateString("fr-FR")}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {u.role === "user" && (
            <button
              onClick={() => handleUpgradeVIP(u.id)}
              title="Upgrade VIP"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setLocation(`/admin/devis?client=${u.email}`)}
            className="text-xs text-[#4A90D9] hover:underline font-medium px-2 py-1"
          >
            Voir devis
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Clients"
      subtitle={`${users.length} utilisateur${users.length > 1 ? "s" : ""}`}
      onRefresh={loadUsers}
    >
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none"
        />
      </div>

      <AdminTable<UserProfile>
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        onRetry={loadUsers}
        emptyMessage="Aucun client enregistré"
        pageSize={10}
        currentPage={page}
        onPageChange={setPage}
        totalCount={filtered.length}
      />
    </AdminPageLayout>
  );
}
