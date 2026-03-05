import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { FileText, ShoppingCart, CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { showCartNotification } from "@/components/CartNotification";
import { useProduct } from "@/hooks/useProducts";

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const productId = match && params ? params.id : null;
  const { product, loading } = useProduct(productId);
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-[#4A90D9] mb-4">Produit non trouvé</h1>
            <Button onClick={() => setLocation("/")} className="btn-rippa">
              Retour à l'accueil
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const galleryImages = product.gallery && product.gallery.length > 0
    ? product.gallery
    : [{ type: "image" as const, src: product.image, alt: product.name }];

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.priceDisplay,
      image: product.image,
      type: "machine"
    });
    showCartNotification(product.name);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Header />

      <main className="flex-grow pt-8 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <a href="/" className="hover:text-[#4A90D9]">Accueil</a>
            <span className="mx-2">/</span>
            <a href="/#minipelles" className="hover:text-[#4A90D9]">Mini-pelles</a>
            <span className="mx-2">/</span>
            <span className="text-[#4A90D9] font-medium">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-8 aspect-[4/3] flex items-center justify-center border border-gray-100 relative overflow-hidden group">
                <img
                  src={galleryImages[activeImage].src}
                  alt={galleryImages[activeImage].alt || `${product.name} vue ${activeImage + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`bg-gray-50 rounded-lg p-2 aspect-square border transition-all ${
                        activeImage === index ? "border-[#4A90D9] ring-1 ring-[#4A90D9]" : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img.src}
                        alt={img.alt || `${product.name} miniature ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <span className="text-[#4A90D9] font-bold tracking-widest uppercase text-sm mb-2 block">{product.subcategory ? `Mini-pelle ${product.subcategory}` : product.category}</span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4A90D9] mb-6">{product.name}</h1>
              <div className="text-2xl font-bold text-[#4A90D9] mb-1">{product.priceDisplay}</div>
              <p className="text-xs text-gray-400 mb-6">Prix de base HT – hors livraison</p>

              <p className="text-gray-600 mb-8 leading-relaxed">
                {product.longDescription || product.description}
              </p>

              {/* Key Specs Grid */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {product.specs.weight && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Poids</span>
                      <span className="block font-bold text-[#4A90D9]">{product.specs.weight}</span>
                    </div>
                  )}
                  {product.specs.power && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Puissance</span>
                      <span className="block font-bold text-[#4A90D9]">{product.specs.power}</span>
                    </div>
                  )}
                  {product.specs.depth && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Profondeur Max</span>
                      <span className="block font-bold text-[#4A90D9]">{product.specs.depth}</span>
                    </div>
                  )}
                  {product.specs.engine && (
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Moteur</span>
                      <span className="block font-bold text-[#4A90D9]">{product.specs.engine}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={handleAddToCart}
                  className="btn-rippa h-14 px-8 text-base flex-1"
                >
                  AJOUTER AU PANIER
                </Button>
                {product.pdf && (
                  <a href={product.pdf} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full h-14 px-8 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white rounded-none uppercase font-bold tracking-wider">
                      <FileText className="mr-2 h-4 w-4" /> FICHE TECHNIQUE
                    </Button>
                  </a>
                )}
              </div>

              {product.features && product.features.length > 0 && (
                <div className="border-t border-gray-100 pt-8">
                  <h3 className="font-serif font-bold text-[#4A90D9] mb-4">Points Forts</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Specs */}
          {product.detailedSpecs && Object.keys(product.detailedSpecs).length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200">Spécifications Techniques</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                {Object.entries(product.detailedSpecs).map(([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold text-[#4A90D9] mb-6 bg-gray-50 p-3 border-l-4 border-[#4A90D9]">{category}</h3>
                    <div className="space-y-4">
                      {items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium text-gray-900 text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financing Banner */}
          <div className="mt-20 bg-[#4A90D9] rounded-lg p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 text-white">Besoin d'un financement ?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Nous proposons des solutions de financement adaptées aux professionnels. Contactez nos experts pour obtenir une simulation personnalisée.
            </p>
            <a
              href="https://wa.me/33663284908?text=Bonjour%2C%20je%20souhaite%20contacter%20un%20conseiller%20concernant%20le%20financement%20d%27une%20mini-pelle."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-[#4A90D9] h-12 px-8">
                Contacter un conseiller
              </Button>
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
