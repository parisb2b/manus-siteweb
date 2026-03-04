import { useState } from "react";
import { Save, Home } from "lucide-react";

interface HousePrice {
  type: string;
  size: string;
  price: number;
}

export default function AdminPricing() {
  const [prices, setPrices] = useState<HousePrice[]>([
    { type: "Standard", size: "20 pieds", price: 5600 },
    { type: "Standard", size: "30 pieds", price: 7400 },
    { type: "Standard", size: "40 pieds", price: 9200 },
    { type: "Premium", size: "20 pieds", price: 9920 },
    { type: "Premium", size: "30 pieds", price: 10700 },
    { type: "Premium", size: "40 pieds", price: 13300 },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const updatePrice = (index: number, newPrice: number) => {
    const updated = [...prices];
    updated[index] = { ...updated[index], price: newPrice };
    setPrices(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ housePrices: prices }),
      });
      setSaveMessage("Prix sauvegardés avec succès");
    } catch {
      setSaveMessage("Erreur lors de la sauvegarde");
    }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const standardPrices = prices.filter((p) => p.type === "Standard");
  const premiumPrices = prices.filter((p) => p.type === "Premium");

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prix des Maisons</h1>
          <p className="text-gray-500 mt-1">Configurez les tarifs des maisons modulaires</p>
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

      {/* Standard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Home className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Maisons Standard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Taille</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Prix (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standardPrices.map((item) => {
                const globalIndex = prices.findIndex(
                  (p) => p.type === item.type && p.size === item.size
                );
                return (
                  <tr key={`${item.type}-${item.size}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{item.type}</td>
                    <td className="px-6 py-4 text-gray-600">{item.size}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updatePrice(globalIndex, parseFloat(e.target.value) || 0)
                          }
                          className="w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                          min="0"
                          step="100"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Home className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-800">Maisons Premium</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Taille</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Prix (€)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {premiumPrices.map((item) => {
                const globalIndex = prices.findIndex(
                  (p) => p.type === item.type && p.size === item.size
                );
                return (
                  <tr key={`${item.type}-${item.size}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{item.type}</td>
                    <td className="px-6 py-4 text-gray-600">{item.size}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updatePrice(globalIndex, parseFloat(e.target.value) || 0)
                          }
                          className="w-32 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                          min="0"
                          step="100"
                        />
                        <span className="text-gray-500">€</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
