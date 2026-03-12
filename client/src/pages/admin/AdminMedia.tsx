import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  Plus,
  Save,
  ChevronDown,
  ChevronRight,
  X,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  Copy,
  Search,
} from "lucide-react";

// ════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════

interface FoldersData {
  folders: Record<string, string[]>;
}

// ════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════

export default function AdminMedia() {
  const [folders, setFolders] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [uploadFolder, setUploadFolder] = useState("solar");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Solar gallery state
  const [siteContent, setSiteContent] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryDirty, setGalleryDirty] = useState(false);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  // ──────────────────────────────────────
  // Fetch images & site content
  // ──────────────────────────────────────
  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/images");
      const data: FoldersData = await res.json();
      setFolders(data.folders || {});
    } catch {
      setFolders({});
    }
    setLoading(false);
  }, []);

  const fetchSiteContent = useCallback(async () => {
    try {
      const res = await fetch("/api/site-content");
      const data = await res.json();
      setSiteContent(data);
      setGalleryImages(data?.pages?.solaire?.galleryImages || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchSiteContent();
  }, [fetchImages, fetchSiteContent]);

  // ──────────────────────────────────────
  // Status message helper
  // ──────────────────────────────────────
  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const copyPath = (imgPath: string) => {
    navigator.clipboard.writeText(imgPath).then(() => {
      setCopiedPath(imgPath);
      setTimeout(() => setCopiedPath(null), 2000);
    }).catch(() => {
      showStatus("error", "Impossible de copier dans le presse-papier");
    });
  };

  // ──────────────────────────────────────
  // Upload
  // ──────────────────────────────────────
  const handleUpload = async (files: FileList | File[]) => {
    const folder = showNewFolder && newFolderName.trim() ? newFolderName.trim() : uploadFolder;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const base64 = await fileToBase64(file);
        const res = await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder, filename: file.name, data: base64 }),
        });
        const result = await res.json();
        if (result.success) successCount++;
        else showStatus("error", result.error || "Erreur upload");
      } catch {
        showStatus("error", `Erreur lors de l'upload de ${file.name}`);
      }
    }
    if (successCount > 0) {
      showStatus("success", `${successCount} image(s) uploadée(s)`);
      await fetchImages();
      if (showNewFolder) {
        setShowNewFolder(false);
        setNewFolderName("");
      }
    }
    setUploading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/xxx;base64, prefix
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ──────────────────────────────────────
  // Delete
  // ──────────────────────────────────────
  const handleDelete = async (imgPath: string) => {
    try {
      const res = await fetch("/api/images/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: imgPath }),
      });
      const result = await res.json();
      if (result.success) {
        showStatus("success", "Image supprimée");
        await fetchImages();
        // Also remove from gallery if present
        if (galleryImages.includes(imgPath)) {
          setGalleryImages((prev) => prev.filter((p) => p !== imgPath));
          setGalleryDirty(true);
        }
      } else {
        showStatus("error", result.error || "Erreur suppression");
      }
    } catch {
      showStatus("error", "Erreur réseau");
    }
    setDeleteConfirm(null);
  };

  // ──────────────────────────────────────
  // Drag & Drop
  // ──────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // ──────────────────────────────────────
  // Gallery management
  // ──────────────────────────────────────
  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    const newArr = [...galleryImages];
    const target = index + direction;
    if (target < 0 || target >= newArr.length) return;
    [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
    setGalleryImages(newArr);
    setGalleryDirty(true);
  };

  const removeFromGallery = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryDirty(true);
  };

  const addToGallery = (imgPath: string) => {
    if (!galleryImages.includes(imgPath)) {
      setGalleryImages((prev) => [...prev, imgPath]);
      setGalleryDirty(true);
    }
    setShowGalleryPicker(false);
  };

  const saveGallery = async () => {
    if (!siteContent) return;
    setGallerySaving(true);
    try {
      const updated = {
        ...siteContent,
        pages: {
          ...siteContent.pages,
          solaire: {
            ...siteContent.pages?.solaire,
            galleryImages,
          },
        },
      };
      const res = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const result = await res.json();
      if (result.success) {
        setSiteContent(updated);
        setGalleryDirty(false);
        showStatus("success", "Galerie solaire sauvegardée");
      } else {
        showStatus("error", "Erreur sauvegarde");
      }
    } catch {
      showStatus("error", "Erreur réseau");
    }
    setGallerySaving(false);
  };

  // ──────────────────────────────────────
  // Folder toggle
  // ──────────────────────────────────────
  const toggleFolder = (folder: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const folderNames = Object.keys(folders).sort();
  const totalImages = Object.values(folders).reduce((acc, arr) => acc + arr.length, 0);

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="space-y-8">
      {/* Status toast */}
      {statusMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            statusMsg.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {statusMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {statusMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Médias</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalImages} image{totalImages !== 1 ? "s" : ""} dans {folderNames.length} dossier{folderNames.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 1: Upload Zone                       */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#4A90D9]" />
          Ajouter des images
        </h2>

        {/* Folder selector */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-gray-700">Dossier :</label>
          {!showNewFolder ? (
            <>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#4A90D9] focus:border-[#4A90D9]"
              >
                {folderNames.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewFolder(true)}
                className="text-sm text-[#4A90D9] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nouveau dossier
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nom du dossier"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#4A90D9] focus:border-[#4A90D9]"
              />
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName("");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
            </>
          )}
        </div>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-[#4A90D9] bg-blue-50"
              : "border-gray-300 hover:border-[#4A90D9] hover:bg-gray-50"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-[#4A90D9]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Upload en cours...</span>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Glissez vos images ici</p>
              <p className="text-gray-400 text-sm mt-1">ou cliquez pour sélectionner (JPG, PNG, WebP, GIF, SVG)</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 2: Gallery Kits Solaires            */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#4A90D9]" />
            Galerie Kits Solaires
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGalleryPicker(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
            <button
              onClick={saveGallery}
              disabled={!galleryDirty || gallerySaving}
              className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg transition-colors ${
                galleryDirty
                  ? "bg-[#4A90D9] text-white hover:bg-[#3a7bc8]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {gallerySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Sauvegarder
            </button>
          </div>
        </div>

        {galleryImages.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Aucune image dans la galerie. Cliquez "Ajouter" pour commencer.</p>
        ) : (
          <div className="space-y-2">
            {galleryImages.map((img, index) => (
              <div
                key={`${img}-${index}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 group"
              >
                <span className="text-xs text-gray-400 w-6 text-center font-mono">{index + 1}</span>
                <img
                  src={img}
                  alt=""
                  className="w-16 h-12 object-contain rounded bg-white border border-gray-200"
                />
                <span className="flex-1 text-sm text-gray-600 truncate">{img}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveGalleryImage(index, -1)}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="Monter"
                  >
                    <ArrowUp className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => moveGalleryImage(index, 1)}
                    disabled={index === galleryImages.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    title="Descendre"
                  >
                    <ArrowDown className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => removeFromGallery(index)}
                    className="p-1 hover:bg-red-100 rounded"
                    title="Retirer de la galerie"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery picker modal */}
      {showGalleryPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Sélectionner une image</h3>
              <button onClick={() => setShowGalleryPicker(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {folderNames.map((folder) => (
                <div key={folder} className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <FolderOpen className="w-4 h-4 text-[#4A90D9]" /> {folder}
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {folders[folder].map((img) => {
                      const inGallery = galleryImages.includes(img);
                      return (
                        <button
                          key={img}
                          onClick={() => !inGallery && addToGallery(img)}
                          disabled={inGallery}
                          className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                            inGallery
                              ? "border-green-400 opacity-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-[#4A90D9] cursor-pointer"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-contain p-1" />
                          {inGallery && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 3: Image Library                     */}
      {/* ═══════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#4A90D9]" />
            Bibliothèque d'images
          </h2>
          {/* Search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4A90D9] focus:border-[#4A90D9] outline-none w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : folderNames.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Aucune image trouvée.</p>
        ) : (
          <div className="space-y-2">
            {folderNames.map((folder) => {
              const filteredImages = searchQuery
                ? folders[folder].filter((img) =>
                    img.split("/").pop()?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : folders[folder];

              if (searchQuery && filteredImages.length === 0) return null;

              return (
                <div key={folder} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* Folder header */}
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    {openFolders.has(folder) || searchQuery ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <FolderOpen className="w-4 h-4 text-[#4A90D9]" />
                    <span className="font-medium text-gray-800">{folder}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {filteredImages.length} image{filteredImages.length !== 1 ? "s" : ""}
                      {searchQuery && folders[folder].length !== filteredImages.length && (
                        <span className="ml-1 text-[#4A90D9]">(filtré)</span>
                      )}
                    </span>
                  </button>

                  {/* Folder content */}
                  {(openFolders.has(folder) || !!searchQuery) && (
                    <div className="px-4 pb-4 pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {filteredImages.map((img) => {
                        const filename = img.split("/").pop() || img;
                        const isCopied = copiedPath === img;
                        return (
                          <div key={img} className="group relative">
                            {/* Thumbnail */}
                            <div className="aspect-square rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center relative">
                              <img
                                src={img}
                                alt={filename}
                                className="w-full h-full object-contain p-1 transition-transform group-hover:scale-110"
                              />
                              {/* Hover overlay with full preview */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate" title={img}>
                              {filename}
                            </p>
                            {/* Action buttons on hover */}
                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Copy path */}
                              <button
                                onClick={() => copyPath(img)}
                                className={`p-1.5 rounded-lg shadow-sm transition-colors ${
                                  isCopied
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white text-gray-600 hover:bg-[#4A90D9] hover:text-white"
                                }`}
                                title="Copier le chemin"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => setDeleteConfirm(img)}
                                className="p-1.5 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-900 mb-2">Supprimer cette image ?</h3>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <img src={deleteConfirm} alt="" className="w-16 h-16 object-contain rounded" />
              <p className="text-sm text-gray-600 break-all">{deleteConfirm}</p>
            </div>
            <p className="text-sm text-red-600 mb-4">
              Cette action est irréversible. L'image sera supprimée du serveur.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
