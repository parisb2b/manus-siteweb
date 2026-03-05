import { useState, useEffect } from "react";
import { Check, Truck, ArrowRight, ShieldCheck, Ruler, Home, Sun, Snowflake, Sofa, BedDouble, PaintBucket, FileText, Info, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/hooks/useProducts";
import type { SizeOption, ProductOption, Destination, GalleryItem } from "@/hooks/useProducts";

const ICON_MAP: Record<string, any> = {
  BedDouble, Snowflake, Sun, Sofa, Home, ShieldCheck, PaintBucket
};

export default function ModularStandard() {
  const { product, loading } = useProduct("maison-modulaire-standard");
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();

  const sizes = product?.sizes || [];
  const options = product?.options || [];
  const destinations = product?.destinations || [];
  const gallery = product?.gallery || [];
  const techSpecs = product?.techSpecs || [];

  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Set default size when product loads
  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [sizes]);

  useEffect(() => {
    if (!selectedSize) return;
    let price = selectedSize.price;
    selectedOptions.forEach(optId => {
      const option = options.find(o => o.id === optId);
      if (option && !option.isQuote) {
        price += option.price;
      }
    });
    setTotalPrice(price);
  }, [selectedSize, selectedOptions, options]);

  const toggleOption = (id: string) => {
    if (selectedOptions.includes(id)) {
      setSelectedOptions(selectedOptions.filter(o => o !== id));
    } else {
      setSelectedOptions([...selectedOptions, id]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize || !product) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const selectedOptionNames = selectedOptions.map(optId => {
      const opt = options.find(o => o.id === optId);
      return opt?.name || optId;
    });

    addToCart({
      id: product.id,
      name: `${product.name} - ${selectedSize.name}`,
      price: formatPrice(totalPrice),
      image: product.image || gallery[0]?.src || "",
      type: "house",
      houseConfig: {
        size: selectedSize.name,
        options: selectedOptionNames,
      },
    });
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-400">Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4">

          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-8">
            <a href="/" className="hover:text-[#4A90D9]">Accueil</a> <span className="mx-2">/</span>
            <a href="/maisons" className="hover:text-[#4A90D9]">Maisons Modulaires</a> <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Standard</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left Column: Images & Details */}
            <div>
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg mb-8 border border-gray-100">
                <Carousel className="w-full">
                  <CarouselContent>
                    {gallery.map((media, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[4/3] relative flex items-center justify-center bg-black">
                          {media.type === 'video' ? (
                            <video
                              controls
                              muted
                              className="w-full h-full object-contain"
                              poster={gallery.find(img => img.type === 'image')?.src}
                            >
                              <source src={media.src} type="video/quicktime" />
                              <source src={media.src} type="video/mp4" />
                              Votre navigateur ne supporte pas la lecture de vidéos.
                            </video>
                          ) : (
                            <img
                              src={media.src}
                              alt={media.alt}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4 bg-white/80 hover:bg-white text-[#4A90D9]" />
                  <CarouselNext className="right-4 bg-white/80 hover:bg-white text-[#4A90D9]" />
                </Carousel>
                <div className="p-4 bg-gray-50 text-center text-xs text-gray-500 italic border-t border-gray-100">
                  Photos non contractuelles. Les modèles présentés peuvent inclure des options.
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-[#4A90D9] mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Caractéristiques Techniques
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {techSpecs.map((spec, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900">{spec.label}</span>
                      <span className="text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-[#4A90D9] mb-2 flex items-center text-sm">
                    <PaintBucket className="w-4 h-4 mr-2" />
                    Personnalisation
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Le choix des finitions (revêtements intérieur/extérieur, couleurs) se fait après validation de la commande.
                    Toute autre personnalisation est possible sur devis.
                  </p>
                </div>

                {product.pdf && (
                  <div className="mt-6">
                    <a
                      href={product.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:border-[#4A90D9] hover:text-[#4A90D9] transition-colors"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Télécharger la Fiche Technique (PDF)
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Configuration & Pricing */}
            <div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-blue-50 sticky top-24">
                <h1 className="text-3xl font-serif font-bold text-[#4A90D9] mb-2">
                  {product.name}
                </h1>
                <p className="text-gray-500 mb-6">
                  {product.longDescription || product.description}
                </p>

                <div className="mb-8">
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Prix de base HT – hors livraison</span>
                  <div className="text-4xl font-bold text-[#4A90D9]">
                    {formatPrice(totalPrice)}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Size Selector */}
                {sizes.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Home className="w-5 h-5 mr-2 text-blue-600" />
                      Choisir la taille
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                            selectedSize?.id === size.id
                              ? "border-[#4A90D9] bg-blue-50 text-[#4A90D9]"
                              : "border-gray-200 text-gray-600 hover:border-blue-200"
                          }`}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options Selector */}
                {options.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                      Options & Équipements
                    </h4>
                    <div className="space-y-3">
                      {options.map((option) => {
                        const IconComponent = option.icon ? ICON_MAP[option.icon] || ShieldCheck : ShieldCheck;
                        return (
                          <div
                            key={option.id}
                            onClick={() => toggleOption(option.id)}
                            className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedOptions.includes(option.id)
                                ? "border-[#4A90D9] bg-blue-50"
                                : "border-gray-100 hover:border-blue-100"
                            }`}
                          >
                            <div className={`mt-1 mr-4 p-2 rounded-full ${
                              selectedOptions.includes(option.id) ? "bg-[#4A90D9] text-white" : "bg-gray-100 text-gray-400"
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${selectedOptions.includes(option.id) ? "text-[#4A90D9]" : "text-gray-700"}`}>
                                  {option.name}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  {option.isQuote ? "Sur devis" : `+ ${formatPrice(option.price)}`}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">{option.description}</p>
                            </div>
                            {selectedOptions.includes(option.id) && (
                              <Check className="w-5 h-5 text-[#4A90D9] ml-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="space-y-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedSize}
                    className="w-full h-14 text-lg font-bold bg-[#4A90D9] hover:bg-[#3A7BC8] shadow-lg shadow-blue-900/20 rounded-xl"
                  >
                    <ShoppingCart className="mr-2 w-5 h-5" />
                    Ajouter au panier
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    *Ce configurateur fournit une estimation. Le prix final sera confirmé par devis officiel.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
