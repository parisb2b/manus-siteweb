import { useState, useEffect } from "react";
import { Save, Home, Loader2, RefreshCw } from "lucide-react";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { formatEur, calculerPrix } from "@/utils/calculPrix";

interface HousePrice {
  type: string;
  size: string;
  prixAchat: number;
}

const DEFAULT_PRICES: HousePrice[] = [
  { type: "Standard", size: "20 pieds", prixAchat: 4308 },
  { type: "Standard", size: "30 pieds", prixAchat: 5692 },
  { type: "Standard", size: "40 pieds", prixAchat: 7077 },
  { type: "Premium", size: "20 pieds", prixAchat: 7631 },
  { type: "Premium", size: "30 pieds", prixAchat: 8231 },
  { type: "Premium", size: "40 pieds", prixAchat: 10231 },
];

export default function AdminPricing() {
  const [prices, setPrices] = useState<HousePrice[]>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    const timeout = setTimeout(() => { setLoading(false); setLoadError("Chargement trop long (timeout 8s)"); }, 8000);
    try {
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "house_prices")
        .single();
      if (data?.value) setPrices(data.value);
    } catch (err: any) {
      setLoadError(err?.message || "Erreur inconnue lors du chargement");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updatePrixAchat = (index: number, val: number) => {
    const updated = [...prices];
    updated[index] = { ...updated[index], prixAchat: val };
    setPrices(updated);
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "house_prices", value: prices, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaveMessage(error ? "Erreur lors de la sauvegarde" : "Prix sauvegardés avec succès");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const standardPrices = prices.filter((p) => p.type === "Standard");
  const premiumPrices = prices.filter((p) => p.type === "Premium");

  const renderTable = (items: HousePrice[], color: string) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
            <th className="text-left px-6 py-3 font-semibold text-gray-600">Taille</th>
            <th className="text-left px-6 py-3 font-semibold text-emerald-600">Prix achat</th>
            <th className="text-left px-6 py-3 font-semibold text-[#4A90D9]">Public ×2</th>
            <th className="text-left px-6 py-3 font-semibold text-orange-500">Partenaire ×1.2</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const globalIndex = prices.findIndex((p) => p.type === item.type && p.size === item.size);
            return (
              <tr key={`${item.type}-${item.size}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{item.type}</td>
                <td className="px-6 py-4 text-gray-600">{item.size}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.prixAchat}
                      onChange={(e) => updatePrixAchat(globalIndex, parseFloat(e.target.value) || 0)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                      min="0"
                      step="100"
                    />
                    <span className="text-gray-400 text-xs">€</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-[#4A90D9]">{formatEur(calculerPrix(item.prixAchat, "user").prixAffiche!)}</td>
                <td className="px-6 py-4 font-semibold text-orange-500">{formatEur(calculerPrix(item.prixAchat, "partner").prixAffiche!)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prix des Maisons</h1>
          <p className="text-gray-500 mt-1">Configurez les prix achat — public et partenaire calculés automatiquement</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${saveMessage.includes("Erreur") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {saveMessage}
        </div>
      )}

      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#4A90D9]" /></div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Home className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Maisons Standard</h2>
            </div>
            {renderTable(standardPrices, "blue")}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-800">Maisons Premium</h2>
            </div>
            {renderTable(premiumPrices, "amber")}
          </div>
        </>
      )}
    </div>
  );
}
