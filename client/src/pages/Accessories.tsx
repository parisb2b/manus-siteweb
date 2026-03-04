import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { showCartNotification } from "@/components/CartNotification";
import { useProducts } from "@/hooks/useProducts";

export default function Accessories() {
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const [, setLocation] = useLocation();
  const { products: accessories, loading } = useProducts("Accessoires");

  const filteredAccessories = selectedModel === "all"
    ? accessories
    : accessories.filter(acc => acc.models?.some(m => m.name === selectedModel));

  const handleAddToCart = (accessory: any, modelName: string, option: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    addToCart({
      id: `${accessory.id}-${modelName}-${option.size}`,
      name: `${accessory.name} - ${modelName} (${option.size})`,
      price: option.price,
      image: accessory.image,
      type: "accessory"
    });
    showCartNotification(`${accessory.name} (${option.size})`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
        <Header />
        <main className="py-16 bg-gray-50 flex-grow flex items-center justify-center">
          <div className="text-gray-400">Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-900">
      <Header />

      <main className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-2 block">Équipements Professionnels</span>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#4A90D9] mb-6">Accessoires & Équipements</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Optimisez la polyvalence de votre mini-pelle Rippa avec notre gamme complète d'accessoires.
              Conçus pour la performance et la durabilité.
            </p>
          </div>

          {/* Filter */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            <Button
              variant={selectedModel === "all" ? "default" : "outline"}
              onClick={() => setSelectedModel("all")}
              className={selectedModel === "all" ? "bg-[#4A90D9] hover:bg-[#4A90D9]/90" : "border-gray-300 text-gray-600"}
            >
              Tous les modèles
            </Button>
            <Button
              variant={selectedModel === "R22 PRO" ? "default" : "outline"}
              onClick={() => setSelectedModel("R22 PRO")}
              className={selectedModel === "R22 PRO" ? "bg-[#4A90D9] hover:bg-[#4A90D9]/90" : "border-gray-300 text-gray-600"}
            >
              R22 PRO
            </Button>
            <Button
              variant={selectedModel === "R32 PRO" ? "default" : "outline"}
              onClick={() => setSelectedModel("R32 PRO")}
              className={selectedModel === "R32 PRO" ? "bg-[#4A90D9] hover:bg-[#4A90D9]/90" : "border-gray-300 text-gray-600"}
            >
              R32 PRO
            </Button>
            <Button
              variant={selectedModel === "R57 PRO" ? "default" : "outline"}
              onClick={() => setSelectedModel("R57 PRO")}
              className={selectedModel === "R57 PRO" ? "bg-[#4A90D9] hover:bg-[#4A90D9]/90" : "border-gray-300 text-gray-600"}
            >
              R57 PRO
            </Button>
          </div>

          {/* Accessories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAccessories.map((accessory) => (
              <div key={accessory.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">
                <div className="aspect-[4/3] bg-gray-100 p-6 flex items-center justify-center relative group">
                  <img
                    src={accessory.image}
                    alt={accessory.name}
                    className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#4A90D9] mb-2">{accessory.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-1">{accessory.description}</p>

                  {accessory.models && accessory.models.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Tarifs par modèle (HT)</h4>

                      {accessory.models.map((model: any) => (
                        (!selectedModel || selectedModel === "all" || selectedModel === model.name) && (
                          <div key={model.name} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white bg-[#4A90D9] px-2 py-0.5 rounded-sm">{model.name}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {model.options.map((option: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded group/option hover:bg-gray-100 transition-colors">
                                  <span className="text-gray-600">{option.size}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-[#4A90D9]">{option.price}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 rounded-full bg-[#4A90D9]/10 text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white"
                                      onClick={() => handleAddToCart(accessory, model.name, option)}
                                    >
                                      <ShoppingCart className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center text-gray-500 text-sm">
            <p>* Tous nos prix sont en Euros et hors frais de transport et frais de douanes.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
