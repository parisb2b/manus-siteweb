import { useState, useEffect, useRef } from "react";
import {
  Navigation,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";

interface MenuItem {
  label: string;
  path: string;
  visible: boolean;
}

export default function AdminNavigation() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/site-content")
      .then((res) => res.json())
      .then((data) => {
        setSiteContent(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const menuItems: MenuItem[] =
    siteContent?.navigation?.menuItems ?? [];

  const updateMenuItems = (newItems: MenuItem[]) => {
    setSiteContent((prev: any) => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        menuItems: newItems,
      },
    }));
  };

  const updateItem = (
    index: number,
    field: keyof MenuItem,
    value: string | boolean
  ) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    updateMenuItems(updated);
  };

  const toggleVisibility = (index: number) => {
    updateItem(index, "visible", !menuItems[index].visible);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;
    const updated = [...menuItems];
    [updated[index], updated[targetIndex]] = [
      updated[targetIndex],
      updated[index],
    ];
    updateMenuItems(updated);
  };

  const addItem = () => {
    const updated = [
      ...menuItems,
      { label: "NOUVEAU LIEN", path: "/nouveau", visible: true },
    ];
    updateMenuItems(updated);
  };

  const deleteItem = (index: number) => {
    const updated = menuItems.filter((_, i) => i !== index);
    updateMenuItems(updated);
    setDeleteConfirm(null);
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOver(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOver !== null && dragIndex !== dragOver) {
      const updated = [...menuItems];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dragOver, 0, moved);
      updateMenuItems(updated);
    }
    setDragIndex(null);
    setDragOver(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteContent),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage("Navigation sauvegardee avec succes");
      } else {
        setSaveMessage("Erreur : " + (data.error || "Echec de la sauvegarde"));
      }
    } catch {
      setSaveMessage("Erreur lors de la sauvegarde");
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 font-sans">
        Chargement de la navigation...
      </div>
    );
  }

  if (!siteContent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-red-500 font-sans">
        Impossible de charger le contenu du site.
      </div>
    );
  }

  const visibleItems = menuItems.filter((item) => item.visible);

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Navigation</h1>
          <p className="text-gray-500 mt-1">
            Configurez le menu principal du site
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            saveMessage.includes("Erreur")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Live Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">
            Apercu du menu
          </h2>
        </div>
        <div className="px-6 py-4">
          {visibleItems.length === 0 ? (
            <p className="text-gray-400 text-sm italic">
              Aucun element visible dans le menu.
            </p>
          ) : (
            <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-1 overflow-x-auto">
              {visibleItems.map((item, i) => (
                <span
                  key={i}
                  className="text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 whitespace-nowrap transition-colors"
                >
                  {item.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Seuls les elements visibles apparaissent dans cette barre de
            previsualisation.
          </p>
        </div>
      </div>

      {/* Menu Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">
            Elements du menu
          </h2>
          <span className="ml-auto text-sm text-gray-400">
            {menuItems.length} element{menuItems.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {menuItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              Aucun element dans le menu. Ajoutez-en un ci-dessous.
            </div>
          ) : (
            menuItems.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                className={`px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4 transition-all cursor-grab active:cursor-grabbing select-none ${
                  dragOver === index ? "border-t-2 border-[#4A90D9] bg-blue-50/30" :
                  dragIndex === index ? "opacity-40 bg-gray-50" :
                  !item.visible ? "bg-gray-50/50" : ""
                }`}
              >
                {/* Grip + Index */}
                <div className="flex items-center gap-2 lg:w-8 shrink-0">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 font-mono lg:hidden">
                    #{index + 1}
                  </span>
                </div>

                {/* Label Input */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-500 mb-1 lg:hidden">
                    Libelle
                  </label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) =>
                      updateItem(index, "label", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 text-sm font-medium"
                    placeholder="Libelle du lien"
                  />
                </div>

                {/* Path Input */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-500 mb-1 lg:hidden">
                    Chemin / URL
                  </label>
                  <input
                    type="text"
                    value={item.path}
                    onChange={(e) =>
                      updateItem(index, "path", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 text-sm font-mono"
                    placeholder="/chemin"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => toggleVisibility(index)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.visible
                        ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                        : "text-gray-400 bg-gray-100 hover:bg-gray-200"
                    }`}
                    title={item.visible ? "Visible - cliquer pour masquer" : "Masque - cliquer pour afficher"}
                  >
                    {item.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Move Up */}
                  <button
                    onClick={() => moveItem(index, "up")}
                    disabled={index === 0}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Monter"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => moveItem(index, "down")}
                    disabled={index === menuItems.length - 1}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Descendre"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  {deleteConfirm === index ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => deleteItem(index)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(index)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Item Button */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 text-[#4A90D9] hover:text-[#357ABD] font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un element au menu
          </button>
        </div>
      </div>
    </div>
  );
}
