import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Check, X, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { adminQuery, adminUpdate } from "@/lib/adminQuery";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import { formatEur } from "@/utils/calculPrix";
import AdminBadge from "@/components/admin/AdminBadge";

// Colonnes réelles de la table products
interface Product {
  id: string;
  categorie?: string;
  nom: string;
  reference?: string;
  numero_interne?: string;
  description?: string;
  prix_achat?: number;
  actif: boolean;
  images?: any; // JSON array
  created_at: string;
  updated_at?: string;
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

// Helper pour extraire la première image du JSON images
function getFirstImage(images: any): string | null {
  try {
    const arr = typeof images === "string" ? JSON.parse(images) : images;
    if (Array.isArray(arr) && arr.length > 0) {
      return typeof arr[0] === "string" ? arr[0] : arr[0]?.url || arr[0]?.src || null;
    }
    return null;
  } catch {
    return null;
  }
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
      select: "id, categorie, nom, reference, numero_interne, description, prix_achat, actif, images, created_at, updated_at",
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

  const toggleActif = async (id: string, currentActif: boolean) => {
    const { error } = await adminUpdate("products", id, { actif: !currentActif });
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, actif: !currentActif } : p))
      );
    }
  };

  const filtered = search
    ? products.filter(
        (p) =>
          p.nom?.toLowerCase().includes(search.toLowerCase()) ||
          p.numero_interne?.toLowerCase().includes(search.toLowerCase()) ||
          p.reference?.toLowerCase().includes(search.toLowerCase()) ||
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
      render: (p) => {
        const img = getFirstImage(p.images);
        return (
          <div className="flex items-center gap-3">
            {img && (
              <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <span className="font-medium text-gray-800">{p.nom}</span>
              {p.reference && (
                <div className="text-xs text-gray-400">Réf: {p.reference}</div>
              )}
            </div>
          </div>
        );
      },
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
      label: "Prix public (×2)",
      className: "text-right",
      render: (p) => (
        <span className="font-semibold">
          {p.prix_achat ? formatEur(p.prix_achat * 2) : "—"}
        </span>
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
