import { useState, useEffect } from "react";
import { Truck, Info, AlertTriangle } from "lucide-react";

// Volume data for folded houses (approximate m³)
const HOUSE_VOLUMES: Record<string, number> = {
  "20m2": 15,
  "40m2": 28,
  "60m2": 45,
  "80m2": 60,
};

// Container specs
const CONTAINER_20FT_VOLUME = 33; // m³
const CONTAINER_40FT_VOLUME = 67; // m³

// Option volumes
const OPTION_VOLUMES: Record<string, number> = {
  ac: 2,      // Pack climatisation: +2 m³
  solar: 4,   // Kit panneaux solaires: +4 m³
  furniture: 0, // Pack meubles: non inclus dans le calcul
};

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

type DeliveryEstimatorProps = {
  houseSize: number; // in m² (20, 40, 60, 80)
  housePrice: number;
  selectedOptions: string[];
  optionPrices: Record<string, number>;
};

export default function DeliveryEstimator({
  houseSize,
  housePrice,
  selectedOptions,
  optionPrices,
}: DeliveryEstimatorProps) {
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

  // Map house size to volume key
  const getVolumeKey = (size: number): string => {
    if (size <= 20) return "20m2";
    if (size <= 40) return "40m2";
    if (size <= 60) return "60m2";
    return "80m2";
  };

  useEffect(() => {
    const volumeKey = getVolumeKey(houseSize);
    let totalVolume = HOUSE_VOLUMES[volumeKey] || 15;

    // Add option volumes (exclude furniture)
    selectedOptions.forEach((optId) => {
      if (optId !== "furniture" && OPTION_VOLUMES[optId]) {
        totalVolume += OPTION_VOLUMES[optId];
      }
    });

    const destPrices = SHIPPING_PRICES[destination];

    if (!destPrices || destPrices["20ft"] === null) {
      // "Estimation sur devis" destinations
      setShippingResult({
        containerType: null,
        shippingPrice: null,
        isQuote: true,
        isOverflow: false,
        totalVolume,
      });
      return;
    }

    if (totalVolume > CONTAINER_40FT_VOLUME) {
      // Overflow
      setShippingResult({
        containerType: null,
        shippingPrice: null,
        isQuote: false,
        isOverflow: true,
        totalVolume,
      });
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
  }, [houseSize, selectedOptions, destination]);

  // Calculate options total
  const optionsTotal = selectedOptions.reduce((acc, optId) => {
    return acc + (optionPrices[optId] || 0);
  }, 0);

  const hasFurniture = selectedOptions.includes("furniture");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const grandTotal =
    housePrice +
    optionsTotal +
    (shippingResult.shippingPrice || 0);

  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
      <h4 className="font-bold text-gray-900 mb-4 flex items-center text-base">
        <Truck className="w-5 h-5 mr-2 text-[#4A90D9]" />
        Estimation Frais de Livraison
      </h4>

      {/* Destination Selector */}
      <div className="mb-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Destination
        </label>
        <select
          className="w-full p-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none"
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

      {/* Options Checkboxes */}
      <div className="mb-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Options incluses dans l'estimation
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedOptions.includes("ac")}
              readOnly
              className="w-4 h-4 rounded border-gray-300 text-[#4A90D9]"
            />
            <span className={selectedOptions.includes("ac") ? "text-gray-900 font-medium" : "text-gray-400"}>
              Pack climatisation (+2 m³)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedOptions.includes("solar")}
              readOnly
              className="w-4 h-4 rounded border-gray-300 text-[#4A90D9]"
            />
            <span className={selectedOptions.includes("solar") ? "text-gray-900 font-medium" : "text-gray-400"}>
              Kit panneaux solaires (+4 m³)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedOptions.includes("furniture")}
              readOnly
              className="w-4 h-4 rounded border-gray-300 text-[#4A90D9]"
            />
            <span className={selectedOptions.includes("furniture") ? "text-gray-900 font-medium" : "text-gray-400"}>
              Pack meubles — <span className="text-orange-500 font-bold">Sur devis séparé</span>
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
        {/* Volume info */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Volume estimé (hors meubles)</span>
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
          <span className="text-gray-600">Frais de livraison estimés</span>
          <span className="font-bold text-lg text-[#4A90D9]">
            {shippingResult.isOverflow
              ? "Nous contacter"
              : shippingResult.isQuote
              ? "Estimation sur devis"
              : shippingResult.shippingPrice !== null
              ? formatPrice(shippingResult.shippingPrice)
              : "—"}
          </span>
        </div>

        {/* Overflow warning */}
        {shippingResult.isOverflow && (
          <div className="flex items-start p-3 bg-orange-50 rounded-lg border border-orange-200 mt-2">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 leading-relaxed">
              Volume dépassant un conteneur 40 pieds ({shippingResult.totalVolume} m³ &gt; {CONTAINER_40FT_VOLUME} m³). Contactez-nous pour un devis personnalisé.
            </p>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between items-end pt-3 border-t-2 border-gray-200">
          <span className="text-gray-700 font-bold">TOTAL ESTIMÉ (HT)</span>
          <div className="text-right">
            <span className="block text-2xl font-bold text-[#4A90D9]">
              {shippingResult.shippingPrice !== null && !shippingResult.isOverflow
                ? formatPrice(grandTotal)
                : formatPrice(housePrice + optionsTotal)}
            </span>
            {(shippingResult.isQuote || shippingResult.isOverflow || shippingResult.shippingPrice === null) && (
              <span className="text-xs text-orange-500 font-medium block mt-1">
                *Hors frais de livraison
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Furniture notice */}
      {hasFurniture && (
        <div className="flex items-start p-3 bg-amber-50 rounded-xl border border-amber-100 mt-4">
          <Info className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Le pack meubles fera l'objet d'un devis et d'un prix séparé. Il n'est pas inclus dans cette estimation.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-400 leading-relaxed mt-4">
        L'estimation des frais de port est calculée uniquement en fonction de la maison sélectionnée et des options techniques choisies (climatisation, panneaux solaires). Le pack meubles n'est pas inclus dans cette estimation : il fera l'objet d'un devis et d'un prix séparé.
      </p>
    </div>
  );
}
