import { useState, useEffect } from "react";
import { Truck, AlertTriangle, Info } from "lucide-react";

// Container specs
const CONTAINER_20FT_VOLUME = 33; // m³
const CONTAINER_40FT_VOLUME = 67; // m³

// Shipping prices per destination per container size
const SHIPPING_PRICES: Record<string, { "20ft": number | null; "40ft": number | null }> = {
  martinique: { "20ft": 5500, "40ft": 9500 },
  guadeloupe: { "20ft": 5000, "40ft": 8500 },
  guyane: { "20ft": null, "40ft": null },
  reunion: { "20ft": null, "40ft": null },
  mayotte: { "20ft": null, "40ft": null },
  autre: { "20ft": null, "40ft": null },
};

const DESTINATIONS = [
  { id: "martinique", name: "Martinique" },
  { id: "guadeloupe", name: "Guadeloupe" },
  { id: "guyane", name: "Guyane" },
  { id: "reunion", name: "Réunion" },
  { id: "mayotte", name: "Mayotte" },
  { id: "autre", name: "Autre destination" },
];

// Approximate volume per product type (m³)
const PRODUCT_VOLUMES: Record<string, number> = {
  // Mini-pelles
  "r18-pro": 4,
  "r22-pro": 5,
  "r32-pro": 7,
  "r57-pro": 12,
  // Maisons (folded)
  "maison-modulaire-standard": 28,
  "maison-modulaire-premium": 35,
  "camping-car-deluxe-hybride": 40,
};

// Fallback: approximate volume for accessories
const DEFAULT_ACCESSORY_VOLUME = 0.3; // m³

type CartShippingEstimatorProps = {
  cartTotal: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    type: "machine" | "accessory" | "solar";
  }>;
  onShippingChange?: (shippingPrice: number | null) => void;
};

export default function CartShippingEstimator({
  cartTotal,
  items,
  onShippingChange,
}: CartShippingEstimatorProps) {
  const [destination, setDestination] = useState("martinique");
  const [shippingResult, setShippingResult] = useState<{
    containerType: string | null;
    shippingPrice: number | null;
    isQuote: boolean;
    isOverflow: boolean;
    totalVolume: number;
  }>({
    containerType: null,
    shippingPrice: null,
    isQuote: false,
    isOverflow: false,
    totalVolume: 0,
  });

  useEffect(() => {
    // Calculate total volume from cart items
    let totalVolume = 0;
    items.forEach((item) => {
      const volumePerUnit = PRODUCT_VOLUMES[item.id] || DEFAULT_ACCESSORY_VOLUME;
      totalVolume += volumePerUnit * item.quantity;
    });

    // Round to 1 decimal
    totalVolume = Math.round(totalVolume * 10) / 10;

    const destPrices = SHIPPING_PRICES[destination];

    if (!destPrices || destPrices["20ft"] === null) {
      setShippingResult({
        containerType: null,
        shippingPrice: null,
        isQuote: true,
        isOverflow: false,
        totalVolume,
      });
      onShippingChange?.(null);
      return;
    }

    if (totalVolume > CONTAINER_40FT_VOLUME) {
      setShippingResult({
        containerType: null,
        shippingPrice: null,
        isQuote: false,
        isOverflow: true,
        totalVolume,
      });
      onShippingChange?.(null);
      return;
    }

    let containerType: string;
    let shippingPrice: number;

    if (totalVolume <= CONTAINER_20FT_VOLUME) {
      containerType = "Conteneur 20 pieds";
      shippingPrice = destPrices["20ft"]!;
    } else {
      containerType = "Conteneur 40 pieds";
      shippingPrice = destPrices["40ft"]!;
    }

    setShippingResult({
      containerType,
      shippingPrice,
      isQuote: false,
      isOverflow: false,
      totalVolume,
    });
    onShippingChange?.(shippingPrice);
  }, [items, destination]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const grandTotal = cartTotal + (shippingResult.shippingPrice || 0);

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
      <h4 className="font-bold text-gray-900 mb-4 flex items-center text-sm">
        <Truck className="w-5 h-5 mr-2 text-[#4A90D9]" />
        Estimation Livraison
      </h4>

      {/* Destination Selector */}
      <div className="mb-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Destination
        </label>
        <select
          className="w-full p-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 text-sm focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          {DESTINATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
        {/* Volume */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Volume estimé</span>
          <span className="font-bold text-gray-900">{shippingResult.totalVolume} m³</span>
        </div>

        {/* Container type */}
        {shippingResult.containerType && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Type de conteneur</span>
            <span className="font-bold text-gray-900">{shippingResult.containerType}</span>
          </div>
        )}

        {/* Shipping price */}
        <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
          <span className="text-gray-600">Frais de livraison</span>
          <span className="font-bold text-lg text-[#4A90D9]">
            {shippingResult.isOverflow
              ? "Nous contacter"
              : shippingResult.isQuote
              ? "Sur devis"
              : shippingResult.shippingPrice !== null
              ? formatPrice(shippingResult.shippingPrice)
              : "—"}
          </span>
        </div>

        {/* Overflow warning */}
        {shippingResult.isOverflow && (
          <div className="flex items-start p-3 bg-orange-50 rounded-xl border border-orange-200 mt-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 leading-relaxed">
              Volume dépassant un conteneur 40 pieds. Contactez-nous pour un devis multi-conteneurs.
            </p>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-end pt-3 border-t-2 border-gray-200">
          <span className="text-gray-700 font-bold text-sm">TOTAL ESTIMÉ (HT)</span>
          <div className="text-right">
            <span className="block text-2xl font-bold text-[#4A90D9]">
              {shippingResult.shippingPrice !== null && !shippingResult.isOverflow
                ? formatPrice(grandTotal)
                : formatPrice(cartTotal)}
            </span>
            {(shippingResult.isQuote || shippingResult.isOverflow || shippingResult.shippingPrice === null) && (
              <span className="text-xs text-orange-500 font-medium block mt-1">
                *Hors frais de livraison
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start p-3 bg-blue-50 rounded-xl border border-blue-100 mt-4">
        <Info className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 leading-relaxed">
          Le volume et les frais de livraison sont des estimations. Le montant final sera confirmé par devis officiel selon la destination et le contenu exact de la commande.
        </p>
      </div>
    </div>
  );
}
