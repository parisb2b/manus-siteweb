import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { Plus, Pencil, Trash2, X, Save, Image as ImageIcon, ChevronRight, ArrowLeft, Undo2, Database, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from "lucide-react";
import { invalidateProductsCache } from "@/hooks/useProducts";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { formatEur, calculerPrix } from "@/utils/calculPrix";
import { ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton } from "@/components/admin/AdminUI";

interface SupabaseProduit {
  id: string;
  nom: string;
  reference?: string;
  reference_interne?: string;
  numero_interne?: string;
  nom_en?: string;
  nom_zh?: string;
  categorie?: string;
  description?: string;
  prix_achat: number;
  prix_public?: number;
  image_url?: string;
  dimensions?: string;
  poids_brut?: number;
  poids_net?: number;
  code_douanier?: string;
  notice_url?: string;
  video_url?: string;
  actif: boolean;
}

interface SpecRow { label: string; value: string; }
interface GalleryItem { type: "image" | "video"; src: string; alt?: string; }
interface SizeOption { id: string; name: string; price: number; approxM2?: number; shipping?: Record<string, number>; }
interface ProductOption { id: string; name: string; description?: string; price: number; icon?: string; isQuote?: boolean; volume?: number; }
interface Destination { id: string; name: string; price?: number | null; }
interface AccessoryModel { name: string; options: { size: string; price: string; }[]; }

interface Product {
  id: string;
  name: string;
  description?: string;
  longDescription?: string;
  price: number;
  priceDisplay: string;
  image?: string;
  link?: string;
  category: string;
  subcategory?: string;
  specs?: Record<string, string>;
  active?: boolean;
  pdf?: string;
  features?: string[];
  gallery?: GalleryItem[];
  detailedSpecs?: Record<string, SpecRow[]>;
  sizes?: SizeOption[];
  options?: ProductOption[];
  destinations?: Destination[];
  techSpecs?: SpecRow[];
  models?: AccessoryModel[];
  [key: string]: any;
}

const CATEGORIES = ["Mini-pelles", "Maisons", "Solaire", "Accessoires"];
const TABS = ["Général", "Médias", "Spécifications", "Configuration", "Modèles"];

function formatPriceDisplay(price: number, existingDisplay?: string): string {
  if (price === 0) {
    if (existingDisplay && existingDisplay !== "0") return existingDisplay;
    return "Sur devis";
  }
  const prefix = existingDisplay?.match(/^(À partir de\s)/)?.[1] || "";
  const formatted = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  const usesEUR = existingDisplay?.includes("EUR");
  const suffix = usesEUR ? " EUR HT" : " € HT";
  return `${prefix}${formatted}${suffix}`;
}

function generateId(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const emptyProduct: Product = {
  id: "", name: "", description: "", price: 0, priceDisplay: "", image: "", category: CATEGORIES[0], active: true,
};

// === Reusable sub-editors ===

function KeyValueEditor({ data, onChange, label }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void; label: string }) {
  const entries = Object.entries(data);
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        {entries.map(([key, value], idx) => (
          <div key={idx} className="flex gap-2">
            <input value={key} onChange={(e) => {
              const newData = { ...data }; delete newData[key]; newData[e.target.value] = value; onChange(newData);
            }} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Clé" />
            <input value={value} onChange={(e) => onChange({ ...data, [key]: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Valeur" />
            <button onClick={() => { const newData = { ...data }; delete newData[key]; onChange(newData); }}
              className="text-red-500 hover:text-red-700 px-2"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => onChange({ ...data, "": "" })}
          className="text-sm text-[#4A90D9] hover:underline">+ Ajouter</button>
      </div>
    </div>
  );
}

function SpecRowsEditor({ rows, onChange, label }: { rows: SpecRow[]; onChange: (r: SpecRow[]) => void; label: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <input value={row.label} onChange={(e) => { const r = [...rows]; r[idx] = { ...r[idx], label: e.target.value }; onChange(r); }}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Label" />
            <input value={row.value} onChange={(e) => { const r = [...rows]; r[idx] = { ...r[idx], value: e.target.value }; onChange(r); }}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Valeur" />
            <button onClick={() => onChange(rows.filter((_, i) => i !== idx))}
              className="text-red-500 hover:text-red-700 px-2"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={() => onChange([...rows, { label: "", value: "" }])}
          className="text-sm text-[#4A90D9] hover:underline">+ Ajouter une ligne</button>
      </div>
    </div>
  );
}

// === Main Component ===

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Général");
  const [isDirty, setIsDirty] = useState(false);
  const [canRestore, setCanRestore] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const originalProductRef = useRef<string>("");

  // Supabase products state
  const [supabaseProds, setSupabaseProds] = useState<SupabaseProduit[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [supabaseEdits, setSupabaseEdits] = useState<Record<string, Partial<SupabaseProduit>>>({});
  const [supabaseSaving, setSupabaseSaving] = useState<string | null>(null);
  const [expandedSupabaseId, setExpandedSupabaseId] = useState<string | null>(null);

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Check if backup exists — /api/backup est dev-only, no-op sur Vercel SPA
  const checkBackupStatus = useCallback(() => {
    if (!import.meta.env.DEV) { setCanRestore(false); return; }
    fetch("/api/backup/status").then(r => r.json()).then(data => setCanRestore(data.hasBackup)).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); checkBackupStatus(); }, [checkBackupStatus]);

  const loadSupabaseProds = useCallback(async () => {
    if (!supabase) return;
    setSupabaseLoading(true);
    const { data } = await supabase.from("products").select("*").order("nom");
    setSupabaseProds((data as SupabaseProduit[]) ?? []);
    setSupabaseLoading(false);
  }, []);

  useEffect(() => { if (supabaseOpen) loadSupabaseProds(); }, [supabaseOpen, loadSupabaseProds]);

  const patchSupabase = (id: string, field: string, val: any) =>
    setSupabaseEdits((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: val } }));

  const saveSupabase = async (id: string) => {
    if (!supabase || !supabaseEdits[id]) return;
    setSupabaseSaving(id);
    await supabase.from("products").update(supabaseEdits[id]).eq("id", id);
    setSupabaseSaving(null);
    setSupabaseEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    await loadSupabaseProds();
  };

  const toggleActif = async (prod: SupabaseProduit) => {
    if (!supabase) return;
    await supabase.from("products").update({ actif: !prod.actif }).eq("id", prod.id);
    setSupabaseProds((prev) => prev.map((p) => p.id === prod.id ? { ...p, actif: !p.actif } : p));
  };

  // /api/products (JSON local) — dev-only. Sur Vercel, l'éditeur JSON est désactivé ;
  // utiliser le panneau Supabase ci-dessous pour gérer les produits.
  const fetchProducts = () => {
    if (!import.meta.env.DEV) { setLoading(false); return; }
    fetch("/api/products").then(r => r.json()).then(data => { setProducts(data); setLoading(false); }).catch(() => setLoading(false));
  };

  const openAdd = () => {
    const p = { ...emptyProduct };
    setEditingProduct(p);
    originalProductRef.current = JSON.stringify(p);
    setIsDirty(false);
    setActiveTab("Général");
  };
  const openEdit = (product: Product) => {
    setEditingProduct({ ...product });
    originalProductRef.current = JSON.stringify(product);
    setIsDirty(false);
    setActiveTab("Général");
  };
  const closeEditor = () => {
    if (isDirty && !window.confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?")) return;
    setEditingProduct(null);
    setIsDirty(false);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    const productToSave: Product = {
      ...editingProduct,
      priceDisplay: formatPriceDisplay(editingProduct.price, editingProduct.priceDisplay),
    };
    if (!productToSave.id) productToSave.id = generateId(productToSave.name);
    if (!productToSave.link) productToSave.link = `/products/${productToSave.id}`;

    let updatedProducts: Product[];
    const existing = products.find(p => p.id === productToSave.id);
    if (existing) {
      updatedProducts = products.map(p => p.id === productToSave.id ? productToSave : p);
    } else {
      updatedProducts = [...products, productToSave];
    }

    try {
      if (import.meta.env.DEV) {
        // Dev-only : backup + sauvegarde JSON locale via API
        await fetch("/api/backup", { method: "POST" });
        await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedProducts) });
        setCanRestore(true);
      }
      // Mise à jour état local dans tous les cas (Vercel = état mémoire uniquement)
      setProducts(updatedProducts);
      invalidateProductsCache();
      setIsDirty(false);
      setEditingProduct(null);
      setSaveMessage(import.meta.env.DEV ? "Produit sauvegardé avec succès" : "Produit mis à jour (session uniquement — utilisez Supabase pour persister)");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch {
      setSaveMessage("Erreur lors de la sauvegarde");
      setTimeout(() => setSaveMessage(""), 3000);
    }
    setSaving(false);
  };

  const handleRestore = async () => {
    // /api/restore est dev-only — non disponible sur Vercel SPA
    if (!import.meta.env.DEV) {
      setSaveMessage("Restauration disponible uniquement en développement local");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    if (!window.confirm("Restaurer la dernière version sauvegardée ? Cette action est irréversible.")) return;
    setRestoring(true);
    try {
      const res = await fetch("/api/restore", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
        invalidateProductsCache();
        setCanRestore(false);
        setSaveMessage("Restauration effectuée avec succès");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Erreur lors de la restauration");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch {
      setSaveMessage("Erreur lors de la restauration");
      setTimeout(() => setSaveMessage(""), 3000);
    }
    setRestoring(false);
  };

  const handleDelete = async (id: string) => {
    const updatedProducts = products.filter(p => p.id !== id);
    try {
      if (import.meta.env.DEV) {
        // Dev-only : persistance JSON locale
        await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedProducts) });
      }
      setProducts(updatedProducts);
      invalidateProductsCache();
      setDeleteConfirm(null);
      setSaveMessage("Produit supprimé");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch {
      setSaveMessage("Erreur lors de la suppression");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!editingProduct) return;
    const updated = { ...editingProduct, [field]: value };
    setEditingProduct(updated);
    setIsDirty(JSON.stringify(updated) !== originalProductRef.current);
  };

  // ========= EDITOR VIEW =========
  if (editingProduct) {
    const isNew = !products.find(p => p.id === editingProduct.id);
    const isHouse = editingProduct.category === "Maisons";
    const isAccessory = editingProduct.category === "Accessoires";
    const visibleTabs = TABS.filter(t => {
      if (t === "Configuration") return isHouse;
      if (t === "Modèles") return isAccessory;
      return true;
    });

    return (
      <div className="font-sans">
        {/* Editor Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={closeEditor} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{isNew ? "Nouveau produit" : `Modifier : ${editingProduct.name}`}</h1>
              <p className="text-sm text-gray-500">{editingProduct.id || "Nouvel identifiant auto-généré"}</p>
            </div>
          </div>
          <button onClick={handleSaveProduct} disabled={saving || !editingProduct.name}
            className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
          {visibleTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-[#4A90D9] shadow-sm" : "text-gray-600 hover:text-gray-800"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">

          {/* === GÉNÉRAL === */}
          {activeTab === "Général" && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" value={editingProduct.name} onChange={e => updateField("name", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="Nom du produit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description courte</label>
                <textarea value={editingProduct.description || ""} onChange={e => updateField("description", e.target.value)}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none resize-none" placeholder="Description courte" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description longue</label>
                <textarea value={editingProduct.longDescription || ""} onChange={e => updateField("longDescription", e.target.value)}
                  rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none resize-none" placeholder="Description détaillée du produit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€ HT)</label>
                  <input type="number" value={editingProduct.price} onChange={e => updateField("price", parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none" min="0" step="0.01" />
                  <p className="text-xs text-gray-400 mt-1">Aperçu : {formatPriceDisplay(editingProduct.price, editingProduct.priceDisplay)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select value={editingProduct.category} onChange={e => updateField("category", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none bg-white">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sous-catégorie</label>
                  <input type="text" value={editingProduct.subcategory || ""} onChange={e => updateField("subcategory", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="Ex: Série Pro, Standard..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien (URL)</label>
                  <input type="text" value={editingProduct.link || ""} onChange={e => updateField("link", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="/products/mon-produit" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700">Produit actif</label>
                <button type="button" onClick={() => updateField("active", !editingProduct.active)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${editingProduct.active !== false ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editingProduct.active !== false ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}

          {/* === MÉDIAS === */}
          {activeTab === "Médias" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image principale (URL)</label>
                <input type="text" value={editingProduct.image || ""} onChange={e => updateField("image", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="/images/products/image.webp" />
                {editingProduct.image && (
                  <div className="mt-2 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={editingProduct.image} alt="Aperçu" className="w-full h-full object-contain" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF (Fiche technique)</label>
                <input type="text" value={editingProduct.pdf || ""} onChange={e => updateField("pdf", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="/documents/fiche_technique.pdf" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Galerie</label>
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                  <span>⠿</span> Glissez-déposez les éléments pour les réorganiser
                </p>
                <div className="space-y-2">
                  {(editingProduct.gallery || []).map((item, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("galleryDragIdx", String(idx));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = parseInt(e.dataTransfer.getData("galleryDragIdx"));
                        if (from === idx) return;
                        const g = [...(editingProduct.gallery || [])];
                        const [moved] = g.splice(from, 1);
                        g.splice(idx, 0, moved);
                        updateField("gallery", g);
                      }}
                      className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-[#4A90D9]/30 transition-colors"
                    >
                      <span className="text-gray-300 select-none mr-1">⠿</span>
                      <select value={item.type} onChange={e => {
                        const g = [...(editingProduct.gallery || [])];
                        g[idx] = { ...g[idx], type: e.target.value as "image" | "video" };
                        updateField("gallery", g);
                      }} className="px-2 py-1.5 border rounded-lg text-sm bg-white w-24">
                        <option value="image">Image</option>
                        <option value="video">Vidéo</option>
                      </select>
                      <input value={item.src} onChange={e => {
                        const g = [...(editingProduct.gallery || [])];
                        g[idx] = { ...g[idx], src: e.target.value };
                        updateField("gallery", g);
                      }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm" placeholder="URL du fichier" />
                      <input value={item.alt || ""} onChange={e => {
                        const g = [...(editingProduct.gallery || [])];
                        g[idx] = { ...g[idx], alt: e.target.value };
                        updateField("gallery", g);
                      }} className="w-32 px-3 py-1.5 border rounded-lg text-sm" placeholder="Texte alt" />
                      <button onClick={() => updateField("gallery", (editingProduct.gallery || []).filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => updateField("gallery", [...(editingProduct.gallery || []), { type: "image", src: "", alt: "" }])}
                    className="text-sm text-[#4A90D9] hover:underline font-medium">+ Ajouter un média</button>
                </div>
              </div>
            </div>
          )}

          {/* === SPÉCIFICATIONS === */}
          {activeTab === "Spécifications" && (
            <div className="space-y-8">
              <KeyValueEditor data={editingProduct.specs || {}} onChange={d => updateField("specs", d)} label="Specs rapides (affichées sur la carte produit)" />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Points forts (features)</label>
                <textarea value={(editingProduct.features || []).join("\n")} onChange={e => updateField("features", e.target.value.split("\n").filter(l => l.trim()))}
                  rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] outline-none resize-none font-mono text-sm"
                  placeholder="Un point fort par ligne" />
              </div>

              {/* Tech Specs (for houses/camping car) */}
              <SpecRowsEditor rows={editingProduct.techSpecs || []} onChange={r => updateField("techSpecs", r)} label="Caractéristiques techniques (maisons / camping-car)" />

              {/* Detailed Specs (for mini-pelles) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Spécifications détaillées par catégorie</label>
                {Object.entries(editingProduct.detailedSpecs || {}).map(([category, rows]) => (
                  <div key={category} className="mb-6 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input value={category} onChange={e => {
                        const ds = { ...(editingProduct.detailedSpecs || {}) };
                        const value = ds[category];
                        delete ds[category];
                        ds[e.target.value] = value;
                        updateField("detailedSpecs", ds);
                      }} className="font-semibold text-[#4A90D9] bg-transparent border-b border-dashed border-gray-300 focus:border-[#4A90D9] outline-none px-1 py-0.5" />
                      <button onClick={() => {
                        const ds = { ...(editingProduct.detailedSpecs || {}) };
                        delete ds[category];
                        updateField("detailedSpecs", ds);
                      }} className="text-red-500 hover:text-red-700 text-xs">Supprimer catégorie</button>
                    </div>
                    <SpecRowsEditor rows={rows as SpecRow[]} onChange={r => updateField("detailedSpecs", { ...(editingProduct.detailedSpecs || {}), [category]: r })} label="" />
                  </div>
                ))}
                <button onClick={() => updateField("detailedSpecs", { ...(editingProduct.detailedSpecs || {}), "Nouvelle catégorie": [] })}
                  className="text-sm text-[#4A90D9] hover:underline">+ Ajouter une catégorie de specs</button>
              </div>
            </div>
          )}

          {/* === CONFIGURATION (Maisons) === */}
          {activeTab === "Configuration" && (
            <div className="space-y-8">
              {/* Sizes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tailles & Prix</label>
                <div className="space-y-3">
                  {(editingProduct.sizes || []).map((size, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <div className="flex gap-2">
                        <input value={size.id} onChange={e => { const s = [...(editingProduct.sizes || [])]; s[idx] = { ...s[idx], id: e.target.value }; updateField("sizes", s); }}
                          className="w-24 px-3 py-2 border rounded-lg text-sm" placeholder="ID" />
                        <input value={size.name} onChange={e => { const s = [...(editingProduct.sizes || [])]; s[idx] = { ...s[idx], name: e.target.value }; updateField("sizes", s); }}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Nom (ex: 20 Pieds (37m²))" />
                        <input type="number" value={size.price} onChange={e => { const s = [...(editingProduct.sizes || [])]; s[idx] = { ...s[idx], price: parseFloat(e.target.value) || 0 }; updateField("sizes", s); }}
                          className="w-28 px-3 py-2 border rounded-lg text-sm" placeholder="Prix" />
                        <button onClick={() => updateField("sizes", (editingProduct.sizes || []).filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-gray-500 self-center">Livraison:</span>
                        <input value={size.shipping?.martinique ?? ""} onChange={e => {
                          const s = [...(editingProduct.sizes || [])];
                          s[idx] = { ...s[idx], shipping: { ...(s[idx].shipping || {}), martinique: parseFloat(e.target.value) || 0 } };
                          updateField("sizes", s);
                        }} className="w-24 px-2 py-1 border rounded text-xs" placeholder="Martinique" />
                        <input value={size.shipping?.guadeloupe ?? ""} onChange={e => {
                          const s = [...(editingProduct.sizes || [])];
                          s[idx] = { ...s[idx], shipping: { ...(s[idx].shipping || {}), guadeloupe: parseFloat(e.target.value) || 0 } };
                          updateField("sizes", s);
                        }} className="w-24 px-2 py-1 border rounded text-xs" placeholder="Guadeloupe" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => updateField("sizes", [...(editingProduct.sizes || []), { id: "", name: "", price: 0, shipping: {} }])}
                    className="text-sm text-[#4A90D9] hover:underline">+ Ajouter une taille</button>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Options</label>
                <div className="space-y-3">
                  {(editingProduct.options || []).map((opt, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <div className="flex gap-2">
                        <input value={opt.id} onChange={e => { const o = [...(editingProduct.options || [])]; o[idx] = { ...o[idx], id: e.target.value }; updateField("options", o); }}
                          className="w-24 px-3 py-2 border rounded-lg text-sm" placeholder="ID" />
                        <input value={opt.name} onChange={e => { const o = [...(editingProduct.options || [])]; o[idx] = { ...o[idx], name: e.target.value }; updateField("options", o); }}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Nom" />
                        <input type="number" value={opt.price} onChange={e => { const o = [...(editingProduct.options || [])]; o[idx] = { ...o[idx], price: parseFloat(e.target.value) || 0 }; updateField("options", o); }}
                          className="w-28 px-3 py-2 border rounded-lg text-sm" placeholder="Prix" />
                        <button onClick={() => updateField("options", (editingProduct.options || []).filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>
                      <input value={opt.description || ""} onChange={e => { const o = [...(editingProduct.options || [])]; o[idx] = { ...o[idx], description: e.target.value }; updateField("options", o); }}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Description de l'option" />
                      <div className="flex gap-2 items-center">
                        <select value={opt.icon || ""} onChange={e => { const o = [...(editingProduct.options || [])]; o[idx] = { ...o[idx], icon: e.target.value }; updateField("options", o); }}
                          className="px-2 py-1.5 border rounded-lg text-sm bg-white">
                          <option value="">Icône...</option>
                          <option value="BedDouble">BedDouble</option>
                          <option value="Snowflake">Snowflake</option>
                          <option value="Sun">Sun</option>
                          <option value="Sofa">Sofa</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-sm text-gray-600">
                          <input type="checkbox" checked={opt.isQuote || false} onChange={e => { const o = [...(editingProduct.options || [])]; o[idx] = { ...o[idx], isQuote: e.target.checked }; updateField("options", o); }} />
                          Sur devis
                        </label>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => updateField("options", [...(editingProduct.options || []), { id: "", name: "", price: 0 }])}
                    className="text-sm text-[#4A90D9] hover:underline">+ Ajouter une option</button>
                </div>
              </div>

              {/* Destinations */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Destinations</label>
                <div className="space-y-2">
                  {(editingProduct.destinations || []).map((dest, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={dest.id} onChange={e => { const d = [...(editingProduct.destinations || [])]; d[idx] = { ...d[idx], id: e.target.value }; updateField("destinations", d); }}
                        className="w-16 px-3 py-2 border rounded-lg text-sm" placeholder="ID" />
                      <input value={dest.name} onChange={e => { const d = [...(editingProduct.destinations || [])]; d[idx] = { ...d[idx], name: e.target.value }; updateField("destinations", d); }}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Nom" />
                      <input type="number" value={dest.price ?? ""} onChange={e => { const d = [...(editingProduct.destinations || [])]; d[idx] = { ...d[idx], price: e.target.value ? parseFloat(e.target.value) : null }; updateField("destinations", d); }}
                        className="w-28 px-3 py-2 border rounded-lg text-sm" placeholder="Prix (vide=devis)" />
                      <button onClick={() => updateField("destinations", (editingProduct.destinations || []).filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => updateField("destinations", [...(editingProduct.destinations || []), { id: "", name: "" }])}
                    className="text-sm text-[#4A90D9] hover:underline">+ Ajouter une destination</button>
                </div>
              </div>
            </div>
          )}

          {/* === MODÈLES (Accessoires) === */}
          {activeTab === "Modèles" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Définissez les modèles de mini-pelles compatibles et les tarifs par taille.</p>
              {(editingProduct.models || []).map((model, mIdx) => (
                <div key={mIdx} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <input value={model.name} onChange={e => { const m = [...(editingProduct.models || [])]; m[mIdx] = { ...m[mIdx], name: e.target.value }; updateField("models", m); }}
                      className="font-bold text-[#4A90D9] bg-transparent border-b border-dashed border-gray-300 focus:border-[#4A90D9] outline-none px-1 py-0.5 text-sm" placeholder="Nom du modèle (ex: R22 PRO)" />
                    <button onClick={() => updateField("models", (editingProduct.models || []).filter((_, i) => i !== mIdx))}
                      className="text-red-500 hover:text-red-700 text-xs">Supprimer modèle</button>
                  </div>
                  <div className="space-y-2">
                    {model.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2">
                        <input value={opt.size} onChange={e => { const m = [...(editingProduct.models || [])]; const opts = [...m[mIdx].options]; opts[oIdx] = { ...opts[oIdx], size: e.target.value }; m[mIdx] = { ...m[mIdx], options: opts }; updateField("models", m); }}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Taille (ex: 80 cm)" />
                        <input value={opt.price} onChange={e => { const m = [...(editingProduct.models || [])]; const opts = [...m[mIdx].options]; opts[oIdx] = { ...opts[oIdx], price: e.target.value }; m[mIdx] = { ...m[mIdx], options: opts }; updateField("models", m); }}
                          className="w-28 px-3 py-2 border rounded-lg text-sm" placeholder="Prix (ex: 191 €)" />
                        <button onClick={() => { const m = [...(editingProduct.models || [])]; m[mIdx] = { ...m[mIdx], options: m[mIdx].options.filter((_, i) => i !== oIdx) }; updateField("models", m); }}
                          className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => { const m = [...(editingProduct.models || [])]; m[mIdx] = { ...m[mIdx], options: [...m[mIdx].options, { size: "", price: "" }] }; updateField("models", m); }}
                      className="text-xs text-[#4A90D9] hover:underline">+ Ajouter une option</button>
                  </div>
                </div>
              ))}
              <button onClick={() => updateField("models", [...(editingProduct.models || []), { name: "", options: [{ size: "", price: "" }] }])}
                className="text-sm text-[#4A90D9] hover:underline">+ Ajouter un modèle</button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ========= LIST VIEW =========
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>Produits</h1>
          <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, margin: '2px 0 0' }}>Gérez le catalogue de produits ({products.length})</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canRestore && (
            <AdminButton variant="warning" size="md" onClick={handleRestore} disabled={restoring}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Undo2 style={{ width: 14, height: 14 }} /> {restoring ? "Restauration..." : "Annuler dernière modification"}
              </span>
            </AdminButton>
          )}
          <AdminButton variant="primary" size="md" onClick={openAdd}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus style={{ width: 14, height: 14 }} /> Ajouter un produit
            </span>
          </AdminButton>
        </div>
      </div>

      {saveMessage && (
        <div style={{
          marginBottom: '12px', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
          background: saveMessage.includes("Erreur") ? ADMIN_COLORS.redBg : ADMIN_COLORS.greenBg,
          color: saveMessage.includes("Erreur") ? ADMIN_COLORS.redText : ADMIN_COLORS.greenText,
          border: `0.5px solid ${saveMessage.includes("Erreur") ? ADMIN_COLORS.redBorder : ADMIN_COLORS.greenBorder}`,
        }}>
          {saveMessage}
        </div>
      )}

      {/* ── Supabase Prix Catalogue ── */}
      {supabase && (
        <AdminCard style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setSupabaseOpen(!supabaseOpen)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database style={{ width: 14, height: 14, color: ADMIN_COLORS.navyAccent }} />
              <span style={{ fontWeight: 600, fontSize: '13px', color: ADMIN_COLORS.navy }}>Prix Catalogue Supabase</span>
              {supabaseProds.length > 0 && <span style={{ fontSize: '10px', color: ADMIN_COLORS.grayText }}>({supabaseProds.length} produits)</span>}
            </div>
            {supabaseOpen ? <ChevronUp style={{ width: 14, height: 14, color: ADMIN_COLORS.grayText }} /> : <ChevronDown style={{ width: 14, height: 14, color: ADMIN_COLORS.grayText }} />}
          </button>

          {supabaseOpen && (
            <div style={{ borderTop: `0.5px solid ${ADMIN_COLORS.grayBorder}` }}>
              {supabaseLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: ADMIN_COLORS.grayText, fontSize: '12px' }}>Chargement...</div>
              ) : supabaseProds.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: ADMIN_COLORS.grayText, fontSize: '12px' }}>Aucun produit dans Supabase.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: ADMIN_COLORS.navyLight, borderBottom: `0.5px solid ${ADMIN_COLORS.navyBorder}` }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.navy, fontSize: '10px' }}>Nom</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.navy, fontSize: '10px' }}>Réf interne</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.navy, fontSize: '10px' }}>N° Interne</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.navy, fontSize: '10px' }}>Réf / Catégorie</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.greenText, fontSize: '10px' }}>Achat</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.navyAccent, fontSize: '10px' }}>Public ×2</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.orangeBtn, fontSize: '10px' }}>Partenaire ×1.2</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: ADMIN_COLORS.navy, fontSize: '10px' }}>Actif</th>
                        <th style={{ padding: '8px 12px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {supabaseProds.map((prod) => {
                        const ed = supabaseEdits[prod.id] ?? {};
                        const prixAchat = ed.prix_achat !== undefined ? ed.prix_achat : prod.prix_achat;
                        const isExpanded = expandedSupabaseId === prod.id;
                        const inputSt: React.CSSProperties = { width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' };
                        const tdSt: React.CSSProperties = { padding: '6px 12px', borderBottom: `0.5px solid ${ADMIN_COLORS.grayBorder}` };
                        return (
                          <Fragment key={prod.id}>
                          <tr>
                            <td style={tdSt}>
                              <button onClick={() => setExpandedSupabaseId(isExpanded ? null : prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div style={{ fontWeight: 600, color: ADMIN_COLORS.navy, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                  {isExpanded ? <ChevronUp style={{ width: 10, height: 10, color: ADMIN_COLORS.grayText }} /> : <ChevronDown style={{ width: 10, height: 10, color: ADMIN_COLORS.grayText }} />}
                                  {prod.nom}
                                </div>
                                {prod.description && <div style={{ fontSize: '9px', color: ADMIN_COLORS.grayText, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '14px' }}>{prod.description}</div>}
                              </button>
                            </td>
                            <td style={tdSt}>
                              <input type="text" value={ed.reference_interne !== undefined ? ed.reference_interne : prod.reference_interne ?? ""}
                                onChange={(e) => patchSupabase(prod.id, "reference_interne", e.target.value)} placeholder="REF-001"
                                style={{ ...inputSt, width: '100px', fontFamily: 'monospace', fontSize: '10px' }} />
                            </td>
                            <td style={tdSt}>
                              <input type="text" value={ed.numero_interne !== undefined ? ed.numero_interne : prod.numero_interne ?? ""}
                                onChange={(e) => patchSupabase(prod.id, "numero_interne", e.target.value)} placeholder="MP-R18-001"
                                style={{ ...inputSt, width: '110px', fontFamily: 'monospace', fontSize: '10px' }} />
                            </td>
                            <td style={{ ...tdSt, color: ADMIN_COLORS.grayText, fontSize: '11px' }}>
                              <div>{prod.reference ?? "—"}</div>
                              <div style={{ fontSize: '9px', color: ADMIN_COLORS.grayText }}>{prod.categorie ?? "—"}</div>
                            </td>
                            <td style={tdSt}>
                              <input type="number" value={ed.prix_achat !== undefined ? ed.prix_achat : prod.prix_achat}
                                onChange={(e) => patchSupabase(prod.id, "prix_achat", e.target.value ? Number(e.target.value) : 0)}
                                style={{ ...inputSt, width: '100px' }} />
                            </td>
                            <td style={{ ...tdSt, fontWeight: 600, color: ADMIN_COLORS.navyAccent, fontSize: '11px' }}>{formatEur(calculerPrix(prixAchat, "user").prixAffiche!)}</td>
                            <td style={{ ...tdSt, fontWeight: 600, color: ADMIN_COLORS.orangeBtn, fontSize: '11px' }}>{formatEur(calculerPrix(prixAchat, "partner").prixAffiche!)}</td>
                            <td style={tdSt}>
                              <button onClick={() => toggleActif(prod)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                {prod.actif ? <ToggleRight style={{ width: 20, height: 20, color: ADMIN_COLORS.greenBtn }} /> : <ToggleLeft style={{ width: 20, height: 20, color: ADMIN_COLORS.grayText }} />}
                              </button>
                            </td>
                            <td style={tdSt}>
                              {supabaseEdits[prod.id] && (
                                <AdminButton variant="primary" size="sm" onClick={() => saveSupabase(prod.id)} disabled={supabaseSaving === prod.id}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    {supabaseSaving === prod.id ? <span>⏳</span> : <Save style={{ width: 10, height: 10 }} />} Sauv.
                                  </span>
                                </AdminButton>
                              )}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} style={{ background: ADMIN_COLORS.grayBg, padding: '12px 16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '800px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>Nom anglais</label>
                                    <input
                                      type="text"
                                      value={ed.nom_en !== undefined ? ed.nom_en : prod.nom_en ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "nom_en", e.target.value)}
                                      placeholder="English name"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>Nom chinois</label>
                                    <input
                                      type="text"
                                      value={ed.nom_zh !== undefined ? ed.nom_zh : prod.nom_zh ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "nom_zh", e.target.value)}
                                      placeholder="中文名称"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>Dimensions (L×l×H cm)</label>
                                    <input
                                      type="text"
                                      value={ed.dimensions !== undefined ? ed.dimensions : prod.dimensions ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "dimensions", e.target.value)}
                                      placeholder="350×150×240"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>Poids brut (kg)</label>
                                    <input
                                      type="number"
                                      value={ed.poids_brut !== undefined ? ed.poids_brut : prod.poids_brut ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "poids_brut", e.target.value ? Number(e.target.value) : null)}
                                      placeholder="1800"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>Poids net (kg)</label>
                                    <input
                                      type="number"
                                      value={ed.poids_net !== undefined ? ed.poids_net : prod.poids_net ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "poids_net", e.target.value ? Number(e.target.value) : null)}
                                      placeholder="1650"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>Code douanier (HS)</label>
                                    <input
                                      type="text"
                                      value={ed.code_douanier !== undefined ? ed.code_douanier : prod.code_douanier ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "code_douanier", e.target.value)}
                                      placeholder="8429.11.00"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontFamily: 'monospace', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>URL notice PDF</label>
                                    <input
                                      type="url"
                                      value={ed.notice_url !== undefined ? ed.notice_url : prod.notice_url ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "notice_url", e.target.value)}
                                      placeholder="https://…/notice.pdf"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: ADMIN_COLORS.grayText, marginBottom: '3px' }}>URL vidéo</label>
                                    <input
                                      type="url"
                                      value={ed.video_url !== undefined ? ed.video_url : prod.video_url ?? ""}
                                      onChange={(e) => patchSupabase(prod.id, "video_url", e.target.value)}
                                      placeholder="https://youtube.com/…"
                                      style={{ width: '100%', border: `0.5px solid ${ADMIN_COLORS.navyBorder}`, borderRadius: '4px', padding: '4px 8px', fontSize: '11px', outline: 'none', background: '#fff', color: ADMIN_COLORS.navy, boxSizing: 'border-box' as const }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: ADMIN_COLORS.grayText, fontSize: '12px' }}>Chargement...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: ADMIN_COLORS.grayText, fontSize: '12px' }}>Aucun produit trouvé.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: ADMIN_COLORS.navy }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '10px' }}>Image</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '10px' }}>Nom</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '10px' }}>Catégorie</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '10px' }}>Prix</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '10px' }}>Statut</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#fff', fontSize: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} onClick={() => openEdit(product)} style={{ cursor: 'pointer', borderBottom: `0.5px solid ${ADMIN_COLORS.grayBorder}` }}>
                    <td style={{ padding: '6px 12px' }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'cover', background: ADMIN_COLORS.grayBg }} onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '6px', background: ADMIN_COLORS.grayBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon style={{ width: 16, height: 16, color: ADMIN_COLORS.grayText }} /></div>
                      )}
                    </td>
                    <td style={{ padding: '6px 12px', fontWeight: 600, color: ADMIN_COLORS.navy }}>{product.name}</td>
                    <td style={{ padding: '6px 12px', color: ADMIN_COLORS.grayTextDark }}>{product.category}</td>
                    <td style={{ padding: '6px 12px', color: ADMIN_COLORS.navy, fontWeight: 600 }}>{product.priceDisplay || `${product.price} €`}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '2px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 500,
                        background: product.active !== false ? ADMIN_COLORS.greenBg : ADMIN_COLORS.redBg,
                        color: product.active !== false ? ADMIN_COLORS.greenText : ADMIN_COLORS.redText,
                      }}>
                        {product.active !== false ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <AdminButton variant="ghost" size="sm" onClick={() => openEdit(product)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Pencil style={{ width: 10, height: 10 }} /> Modifier</span>
                        </AdminButton>
                        <AdminButton variant="danger" size="sm" onClick={() => setDeleteConfirm(product.id)}>
                          <Trash2 style={{ width: 10, height: 10 }} />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {deleteConfirm !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: '8px' }}>Confirmer la suppression</h3>
            <p style={{ color: ADMIN_COLORS.grayTextDark, fontSize: '12px', marginBottom: '20px' }}>Êtes-vous sûr de vouloir supprimer ce produit ?</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <AdminButton variant="ghost" size="md" onClick={() => setDeleteConfirm(null)}>Annuler</AdminButton>
              <AdminButton variant="danger" size="md" onClick={() => handleDelete(deleteConfirm)}>Supprimer</AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
