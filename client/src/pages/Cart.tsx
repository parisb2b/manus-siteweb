import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowLeft, FileText, Upload, Link as LinkIcon, Package, X } from "lucide-react";
import { Link } from "wouter";
import DevisForm, { type DevisProduit } from "@/components/DevisForm";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, profile, role } = useAuth();

  const [showDevisModal, setShowDevisModal] = useState(false);

  // Custom product form
  const [customProduct, setCustomProduct] = useState({
    name: "",
    specs: "",
    url: "",
    hasFile: false,
  });

  // Parse price string to number
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

  // Produits formatés pour DevisForm
  const devisProduits: DevisProduit[] = items.map((item) => ({
    id: item.id,
    nom: item.name,
    quantite: item.quantity,
    prixAffiche: parsePrice(item.price),
    prixUnitaire: parsePrice(item.price),
  }));

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      {/* Modal DevisForm */}
      {showDevisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Générer mon devis</h2>
              <button
                onClick={() => setShowDevisModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DevisForm
                produits={devisProduits}
                prixTotalCalcule={total}
                onSuccess={() => setShowDevisModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8">
          Votre Panier
        </h1>

        {items.length === 0 && !customProduct.name ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
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
                  {/* Table Header */}
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
                        <Link href={item.type === "machine" ? `/products/${item.id}` : item.type === "solar" ? `/solaire/${item.id.replace("kit-solaire-", "kit-")}` : "/accessoires"}>
                          <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                        </Link>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                          <p className="text-xs text-gray-400 capitalize">
                            {item.type === "machine" ? "Machine" : item.type === "solar" ? "Kit Solaire" : item.type === "house" ? "Maison Modulaire" : "Accessoire"}
                          </p>
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
                    <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#4A90D9] transition-colors cursor-pointer block">
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
                      <p className="text-xs text-green-600 mt-2 font-medium">✓ Fichier sélectionné</p>
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
                    <span className="text-gray-600 font-medium">Total HT (produits)</span>
                    <span className="text-2xl font-bold text-[#4A90D9]">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Prix hors taxes et hors livraison</p>
                </div>

                <Button
                  onClick={() => setShowDevisModal(true)}
                  disabled={items.length === 0 && !customProduct.name}
                  className="w-full h-14 text-base font-bold bg-[#4A90D9] hover:bg-[#3A7BC8] text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <FileText className="h-5 w-5" />
                  Je veux un devis
                </Button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Votre devis PDF sera généré et téléchargé instantanément.
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
