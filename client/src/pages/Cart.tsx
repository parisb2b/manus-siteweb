import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { trackQuoteRequest } from "@/lib/analytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowLeft, MessageCircle, Upload, Link as LinkIcon, Package, Truck, AlertTriangle, LogIn } from "lucide-react";
import { Link } from "wouter";

// Shipping calculation constants
const CONTAINER_20FT_VOLUME = 33;
const CONTAINER_40FT_VOLUME = 67;

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

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, profile, setShowAuthModal } = useAuth();

  const [customProduct, setCustomProduct] = useState({
    name: "",
    specs: "",
    url: "",
    hasFile: false,
  });

  const [destination, setDestination] = useState("martinique");

  const parsePrice = (priceStr: string): number => {
    const cleaned = priceStr
      .replace(/[^0-9,.\s]/g, "")
      .replace(/\s/g, "")
      .replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const subtotals = items.map((item) => ({
    ...item,
    subtotal: parsePrice(item.price) * item.quantity,
  }));

  const total = subtotals.reduce((acc, item) => acc + item.subtotal, 0);

  // Delivery estimation - simplified for cart context
  const estimatedVolume = Math.max(total / 1000, 5);
  const destPrices = SHIPPING_PRICES[destination];
  const isQuoteDestination = !destPrices || destPrices["20ft"] === null;
  const isOverflow = estimatedVolume > CONTAINER_40FT_VOLUME;

  let containerType: string | null = null;
  let shippingPrice: number | null = null;

  if (!isQuoteDestination && !isOverflow && destPrices) {
    if (estimatedVolume <= CONTAINER_20FT_VOLUME) {
      containerType = "Conteneur 20 pieds";
      shippingPrice = destPrices["20ft"];
    } else {
      containerType = "Conteneur 40 pieds";
      shippingPrice = destPrices["40ft"];
    }
  }

  const grandTotal = total + (shippingPrice || 0);

  const handleRequestQuote = () => {
    if (items.length === 0 && !customProduct.name) return;

    trackQuoteRequest(total, items.length);

    let message = "Bonjour, je souhaite obtenir un devis pour :\n\n";

    if (user && profile) {
      message += `CLIENT : ${profile.prenom} ${profile.nom}\n`;
      message += `Email : ${profile.email}\n`;
      if (profile.telephone) message += `Tél : ${profile.telephone}\n`;
      message += "\n";
    }

    if (items.length > 0) {
      message += "=== PANIER ===\n";
      items.forEach((item) => {
        const subtotal = parsePrice(item.price) * item.quantity;
        message += `- ${item.name} x${item.quantity} — ${item.price}`;
        if (item.quantity > 1) {
          message += ` (sous-total: ${formatPrice(subtotal)})`;
        }
        if (item.type === "house" && item.houseConfig) {
          message += `\n  Taille: ${item.houseConfig.size}`;
          if (item.houseConfig.options.length > 0) {
            message += `\n  Options: ${item.houseConfig.options.join(", ")}`;
          }
        }
        message += "\n";
      });
      message += `\nTOTAL PRODUITS : ${formatPrice(total)}\n`;
    }

    if (shippingPrice !== null) {
      message += `\nLIVRAISON ESTIMÉE (${DESTINATIONS.find(d => d.id === destination)?.name}) : ${formatPrice(shippingPrice)}\n`;
      message += `TOTAL GÉNÉRAL : ${formatPrice(grandTotal)}\n`;
    } else {
      message += `\nDESTINATION : ${DESTINATIONS.find(d => d.id === destination)?.name} (livraison sur devis)\n`;
    }

    if (customProduct.name) {
      message += "\n=== PRODUIT PERSONNALISÉ ===\n";
      message += `Nom : ${customProduct.name}\n`;
      if (customProduct.specs) message += `Spécifications : ${customProduct.specs}\n`;
      if (customProduct.url) message += `Lien : ${customProduct.url}\n`;
      if (customProduct.hasFile) message += `(Image/vidéo jointe séparément)\n`;
    }

    message += "\nMerci de me recontacter pour finaliser la commande et les frais de transport.";

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/33663284908?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8">
          Votre Panier
        </h1>

        {!user ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <LogIn className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Connexion requise</h2>
            <p className="text-gray-500 mb-6 text-lg max-w-md mx-auto">
              Vous devez être connecté pour accéder à votre panier et ajouter des produits.
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              className="bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold px-8 py-6 text-lg rounded-xl"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Se connecter / S'inscrire
            </Button>
          </div>
        ) : items.length === 0 && !customProduct.name ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-6 text-lg">
              Votre panier est vide pour le moment.
            </p>
            <Link href="/">
              <Button className="btn-rippa">Découvrir nos produits</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="hidden sm:grid grid-cols-12 gap-4 bg-gray-50 px-6 py-3 text-xs font-bold uppercase text-gray-500 tracking-wider border-b border-gray-200">
                    <div className="col-span-5">Produit</div>
                    <div className="col-span-2 text-center">Prix unitaire</div>
                    <div className="col-span-2 text-center">Quantité</div>
                    <div className="col-span-2 text-right">Sous-total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {subtotals.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="sm:col-span-5 flex items-center gap-4">
                        <Link href={item.type === "machine" ? `/products/${item.id}` : item.type === "house" ? "/maisons" : item.type === "solar" ? "/solaire" : "/accessoires"}>
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                        </Link>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-400 capitalize">
                            {item.type === "machine" ? "Machine" : item.type === "house" ? "Maison modulaire" : item.type === "solar" ? "Kit Solaire" : "Accessoire"}
                          </p>
                          {item.houseConfig && (
                            <div className="mt-1 space-y-0.5">
                              <p className="text-xs text-gray-500">Taille : {item.houseConfig.size}</p>
                              {item.houseConfig.options.length > 0 && (
                                <p className="text-xs text-gray-500">Options : {item.houseConfig.options.join(", ")}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2 text-center">
                        <span className="sm:hidden text-xs text-gray-500 mr-2">Prix :</span>
                        <span className="text-sm font-medium text-gray-700">{item.price}</span>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-center">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-gray-100 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-4 py-1 text-sm font-bold min-w-[40px] text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-gray-100 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2 text-right">
                        <span className="sm:hidden text-xs text-gray-500 mr-2">Sous-total :</span>
                        <span className="font-bold text-[#4A90D9]">{formatPrice(item.subtotal)}</span>
                      </div>

                      <div className="sm:col-span-1 text-right">
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <Link href="/">
                  <Button variant="ghost" className="text-gray-600">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Continuer mes achats
                  </Button>
                </Link>
                {items.length > 0 && (
                  <Button variant="outline" onClick={clearCart} className="text-red-500 border-red-200 hover:bg-red-50">
                    Vider le panier
                  </Button>
                )}
              </div>

              {/* Custom Product Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mt-4">
                <h3 className="text-lg font-bold text-[#4A90D9] mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produit personnalisé
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Vous cherchez un produit spécifique non listé ? Décrivez-le ci-dessous et nous l'inclurons dans votre demande de devis.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nom du produit</label>
                    <input
                      type="text"
                      placeholder="Ex: Godet trapèze 600mm"
                      value={customProduct.name}
                      onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Spécifications techniques</label>
                    <textarea
                      placeholder="Décrivez les caractéristiques souhaitées..."
                      value={customProduct.specs}
                      onChange={(e) => setCustomProduct({ ...customProduct, specs: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Lien URL (optionnel)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        placeholder="https://example.com/produit"
                        value={customProduct.url}
                        onChange={(e) => setCustomProduct({ ...customProduct, url: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Image / Vidéo</label>
                    <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#4A90D9] transition-colors cursor-pointer block">
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Glissez votre fichier ici ou <span className="text-[#4A90D9] font-bold">cliquez pour choisir</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Images (JPG, PNG) ou vidéos (MP4) - Max 10 MB</p>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={() => setCustomProduct({ ...customProduct, hasFile: true })}
                      />
                    </label>
                    {customProduct.hasFile && (
                      <p className="text-xs text-green-600 mt-2 font-medium">Fichier sélectionné</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-24 shadow-sm">
                <h3 className="text-xl font-bold text-[#4A90D9] mb-6">Récapitulatif</h3>

                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate pr-2">
                        {item.name} <span className="text-gray-400">x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {formatPrice(parsePrice(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}

                  {customProduct.name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate pr-2">{customProduct.name}</span>
                      <span className="font-medium text-orange-500">Sur devis</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Nombre d'articles</span>
                    <span className="font-bold">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-gray-600 font-medium">Sous-total HT</span>
                    <span className="text-2xl font-bold text-[#4A90D9]">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Delivery Estimator */}
                {items.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center text-sm">
                      <Truck className="w-4 h-4 mr-2 text-[#4A90D9]" />
                      Estimation Livraison
                    </h4>

                    <div className="mb-3">
                      <select
                        className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none"
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

                    {containerType && (
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-gray-700">{containerType}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                      <span className="text-gray-600">Frais estimés</span>
                      <span className="font-bold text-[#4A90D9]">
                        {isOverflow
                          ? "Nous contacter"
                          : isQuoteDestination
                          ? "Sur devis"
                          : shippingPrice !== null
                          ? formatPrice(shippingPrice)
                          : "—"}
                      </span>
                    </div>

                    {isOverflow && (
                      <div className="flex items-start p-2 bg-orange-50 rounded-xl border border-orange-200 mt-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-orange-800 leading-relaxed">
                          Volume important. Contactez-nous pour un devis personnalisé.
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-2">
                      Estimation indicative. Le tarif exact sera confirmé dans le devis.
                    </p>
                  </div>
                )}

                {/* Grand Total with shipping */}
                {shippingPrice !== null && items.length > 0 && !isQuoteDestination && !isOverflow && (
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-700 font-bold text-sm">Total estimé HT</span>
                      <span className="text-2xl font-bold text-[#4A90D9]">{formatPrice(grandTotal)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Produits + livraison estimée</p>
                  </div>
                )}

                <Button
                  onClick={handleRequestQuote}
                  disabled={items.length === 0 && !customProduct.name}
                  className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  Je veux un devis
                </Button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Vous serez redirigé vers WhatsApp pour envoyer votre demande à notre équipe commerciale.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
