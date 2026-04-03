import { useState, useEffect, useCallback, useRef } from "react";
import { Package, Search, Check, X, Pencil } from "lucide-react";
import { adminQuery, adminUpdate, adminDelete } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import { formatEur } from "@/utils/calculPrix";

interface Product {
  id: string;
  nom: string;
  categorie?: string;
  prix_achat?: number;
  prix_public?: number;
  numero_interne?: string;
  stock?: number;
  image_url?: string;
  created_at: string;
}

// ── Editable Cell ──────────────────────────────────────────
function EditableRefCell({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-28 px-2 py-1 border border-[#4A90D9] rounded text-sm font-mono focus:ring-1 focus:ring-[#4A90D9] outline-none"
        />
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => {
        setDraft(value || "");
        setEditing(true);
      }}
      className="font-mono text-sm text-gray-600 cursor-pointer hover:text-[#4A90D9] group flex items-center gap-1"
      title="Double-cliquer pour modifier"
    >
      {value || <span className="text-gray-300 italic">—</span>}
      <Pencil className="w-3 h-3 text-gray-300 group-hover:text-[#4A90D9] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await adminQuery<Product>("products", {
      select: "id, nom, categorie, prix_achat, prix_public, numero_interne, stock, image_url, created_at",
      order: { column: "nom", ascending: true },
    });

    if (result.error) {
      setError(result.error);
    }
    setProducts(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleUpdateRef = async (id: string, value: string) => {
    const { error } = await adminUpdate("products", id, { numero_interne: value });
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, numero_interne: value } : p))
      );
      setToast("Réf. mise à jour");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await adminDelete("products", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filtered = search
    ? products.filter(
        (p) =>
          p.nom?.toLowerCase().includes(search.toLowerCase()) ||
          p.numero_interne?.toLowerCase().includes(search.toLowerCase()) ||
          p.categorie?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const columns: Column<Product>[] = [
    {
      key: "numero_interne",
      label: "Réf. interne",
      render: (p) => (
        <EditableRefCell
          value={p.numero_interne || ""}
          onSave={(val) => handleUpdateRef(p.id, val)}
        />
      ),
    },
    {
      key: "nom",
      label: "Nom",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.image_url && (
            <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          )}
          <span className="font-medium text-gray-800">{p.nom}</span>
        </div>
      ),
    },
    {
      key: "categorie",
      label: "Catégorie",
      render: (p) => (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {p.categorie || "—"}
        </span>
      ),
    },
    {
      key: "prix_achat",
      label: "Prix achat",
      className: "text-right",
      render: (p) => <span>{p.prix_achat ? formatEur(p.prix_achat) : "—"}</span>,
    },
    {
      key: "prix_public",
      label: "Prix public (x2)",
      className: "text-right",
      render: (p) => (
        <span className="font-semibold">
          {p.prix_achat ? formatEur(p.prix_achat * 2) : p.prix_public ? formatEur(p.prix_public) : "—"}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      className: "text-center",
      render: (p) => (
        <span className={`font-semibold ${(p.stock || 0) <= 0 ? "text-red-500" : "text-gray-700"}`}>
          {p.stock ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleDelete(p.id)}
            title="Supprimer"
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Produits"
      subtitle={`${products.length} produit${products.length > 1 ? "s" : ""} — double-cliquer sur la réf. pour modifier`}
      onRefresh={loadProducts}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher produit, réf., catégorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none"
        />
      </div>

      <AdminTable<Product>
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        onRetry={loadProducts}
        emptyMessage="Aucun produit enregistré"
        pageSize={10}
        currentPage={page}
        onPageChange={setPage}
        totalCount={filtered.length}
      />
    </AdminPageLayout>
  );
}
