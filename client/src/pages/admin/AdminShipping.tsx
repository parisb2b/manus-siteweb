import { useState, useEffect } from "react";
import { Save, Truck, Plus, Trash2, Package } from "lucide-react";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export default function AdminShipping() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load site-content on mount
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const timer = setTimeout(() => { setLoading(false); setLoadError('Délai dépassé (8s)'); }, 8000);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("value")
          .eq("key", "site_content")
          .single();
        if (error) throw error;
        if (data?.value) {
          setSiteContent(data.value);
        }
      } catch (err: any) {
        setLoadError(err?.message ?? 'Erreur');
        setMessage({ type: "error", text: "Erreur lors du chargement des donnees." });
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    })();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Save the full siteContent back
  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "site_content", value: siteContent, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      showMessage("error", "Erreur lors de la sauvegarde.");
    } else {
      showMessage("success", "Tarifs de livraison sauvegardes avec succes.");
    }
  };

  // Update a destination field
  const updateDestination = (index: number, field: string, value: any) => {
    setSiteContent((prev: any) => {
      const updated = structuredClone(prev);
      const dest = updated.shipping.destinations[index];

      if (field === "onQuote") {
        dest.onQuote = value;
        if (value) {
          delete dest.container20;
          delete dest.container40;
        }
      } else if (field === "container20" || field === "container40") {
        if (value === "") {
          delete dest[field];
        } else {
          dest[field] = parseFloat(value);
        }
      } else {
        dest[field] = value;
      }

      return updated;
    });
  };

  // Add a new destination
  const addDestination = () => {
    setSiteContent((prev: any) => {
      const updated = structuredClone(prev);
      updated.shipping.destinations.push({ name: "", onQuote: true });
      return updated;
    });
  };

  // Delete a destination
  const deleteDestination = (index: number) => {
    setSiteContent((prev: any) => {
      const updated = structuredClone(prev);
      updated.shipping.destinations.splice(index, 1);
      return updated;
    });
    setDeleteConfirm(null);
  };

  // Update price per cubic meter
  const updatePricePerCubicMeter = (value: string) => {
    setSiteContent((prev: any) => {
      const updated = structuredClone(prev);
      updated.shipping.pricePerCubicMeter = value === "" ? 0 : parseFloat(value);
      return updated;
    });
  };

  // Update container config
  const updateContainer = (size: "twenty" | "forty", field: "volume" | "label", value: string) => {
    setSiteContent((prev: any) => {
      const updated = structuredClone(prev);
      if (field === "volume") {
        updated.shipping.containers[size].volume = value === "" ? 0 : parseFloat(value);
      } else {
        updated.shipping.containers[size].label = value;
      }
      return updated;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="font-sans flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#4A90D9] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement des tarifs...</p>
        </div>
      </div>
    );
  }

  if (!siteContent || !siteContent.shipping) {
    return (
      <div className="font-sans">
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
          Impossible de charger les donnees de livraison.
          {loadError && <span className="block mt-1 text-xs text-red-500">{loadError}</span>}
        </div>
      </div>
    );
  }

  const { shipping } = siteContent;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tarifs de Livraison</h1>
          <p className="text-gray-500 mt-1">
            Configurez les tarifs d'expedition par destination
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

      {/* Message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Destinations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#4A90D9]" />
            <h2 className="text-lg font-semibold text-gray-800">Destinations</h2>
          </div>
          <button
            onClick={addDestination}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A90D9] hover:text-[#357ABD] transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Destination</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">
                  {shipping.containers.twenty.label} (EUR)
                </th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">
                  {shipping.containers.forty.label} (EUR)
                </th>
                <th className="text-center px-6 py-3 font-semibold text-gray-600">Sur devis</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shipping.destinations.map((dest: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={dest.name || ""}
                      onChange={(e) => updateDestination(index, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                      placeholder="Nom de la destination"
                    />
                  </td>

                  {/* Container 20ft */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={dest.onQuote ? "" : (dest.container20 ?? "")}
                        onChange={(e) => updateDestination(index, "container20", e.target.value)}
                        disabled={!!dest.onQuote}
                        className={`w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 ${
                          dest.onQuote ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                        }`}
                        placeholder={dest.onQuote ? "Sur devis" : "Prix"}
                        min="0"
                        step="100"
                      />
                      {!dest.onQuote && dest.container20 != null && (
                        <span className="text-gray-500">EUR</span>
                      )}
                    </div>
                  </td>

                  {/* Container 40ft */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={dest.onQuote ? "" : (dest.container40 ?? "")}
                        onChange={(e) => updateDestination(index, "container40", e.target.value)}
                        disabled={!!dest.onQuote}
                        className={`w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 ${
                          dest.onQuote ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                        }`}
                        placeholder={dest.onQuote ? "Sur devis" : "Prix"}
                        min="0"
                        step="100"
                      />
                      {!dest.onQuote && dest.container40 != null && (
                        <span className="text-gray-500">EUR</span>
                      )}
                    </div>
                  </td>

                  {/* On Quote checkbox */}
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={!!dest.onQuote}
                      onChange={(e) => updateDestination(index, "onQuote", e.target.checked)}
                      className="w-4 h-4 text-[#4A90D9] border-gray-300 rounded focus:ring-[#4A90D9] cursor-pointer"
                    />
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-4 text-center">
                    {deleteConfirm === index ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteDestination(index)}
                          className="text-xs font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                        title="Supprimer cette destination"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {shipping.destinations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    Aucune destination configuree. Cliquez sur "Ajouter" pour en creer une.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Container Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Configuration des conteneurs</h2>
        </div>
        <div className="px-6 py-6 space-y-6">
          {/* Container 20ft */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label conteneur 20 pieds
              </label>
              <input
                type="text"
                value={shipping.containers.twenty.label}
                onChange={(e) => updateContainer("twenty", "label", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume conteneur 20 pieds (m3)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={shipping.containers.twenty.volume}
                  onChange={(e) => updateContainer("twenty", "volume", e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  min="0"
                  step="1"
                />
                <span className="text-gray-500 text-sm">m3</span>
              </div>
            </div>
          </div>

          {/* Container 40ft */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label conteneur 40 pieds
              </label>
              <input
                type="text"
                value={shipping.containers.forty.label}
                onChange={(e) => updateContainer("forty", "label", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume conteneur 40 pieds (m3)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={shipping.containers.forty.volume}
                  onChange={(e) => updateContainer("forty", "volume", e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  min="0"
                  step="1"
                />
                <span className="text-gray-500 text-sm">m3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price per m3 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Tarification au volume</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-sm font-medium text-gray-700 min-w-[140px]">
              Prix au m3
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={shipping.pricePerCubicMeter}
                onChange={(e) => updatePricePerCubicMeter(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                min="0"
                step="10"
              />
              <span className="text-gray-500">EUR / m3</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Ce tarif est utilise pour calculer le cout de livraison au volume pour les petits colis.
          </p>
        </div>
      </div>
    </div>
  );
}
