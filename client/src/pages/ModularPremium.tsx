import { useState, useEffect, useRef } from "react";
import { Check, Truck, ArrowRight, ShieldCheck, Ruler, Home, Sun, Snowflake, Sofa, BedDouble, PaintBucket, FileText, Info, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProduct } from "@/hooks/useProducts";
import type { SizeOption, ProductOption } from "@/hooks/useProducts";

const ICON_MAP: Record<string, any> = {
  BedDouble, Snowflake, Sun, Sofa, Home, ShieldCheck, PaintBucket
};

export default function ModularPremium() {
  const { product, loading } = useProduct("maison-modulaire-premium");
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();

  const sizes = product?.sizes || [];
  const options = product?.options || [];
  const gallery = product?.gallery || [];
  const techSpecs = product?.techSpecs || [];

  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Carousel Logic
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % gallery.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Auto-play video when slide changes
  useEffect(() => {
    if (gallery.length > 0 && gallery[currentSlide]?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [currentSlide, gallery]);

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
            <span className="text-gray-900 font-medium">Premium</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left Column: Images & Details */}
            <div>
              {/* Media Carousel */}
              {gallery.length > 0 && (
                <>
                  <div className="bg-black rounded-3xl overflow-hidden shadow-lg mb-8 relative aspect-video group">
                    {gallery[currentSlide].type === 'video' ? (
                      <video
                        ref={videoRef}
                        src={gallery[currentSlide].src}
                        className="w-full h-full object-contain"
                        loop
                        muted={isMuted}
                        playsInline
                        autoPlay
                      />
                    ) : (
                      <img
                        src={gallery[currentSlide].src}
                        alt={gallery[currentSlide].alt}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Navigation Arrows */}
                    <button
                      onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Video Controls */}
                    {gallery[currentSlide].type === 'video' && (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                          className="bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                          className="bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                      </div>
                    )}

                    {/* Slide Counter */}
                    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-medium backdrop-blur-sm">
                      {currentSlide + 1} / {gallery.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {gallery.map((media, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          currentSlide === idx ? 'border-[#4A90D9] ring-2 ring-[#4A90D9]/20' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        {media.type === 'video' ? (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                            <Play className="w-6 h-6 text-white absolute z-10" />
                            <video src={media.src} className="w-full h-full object-cover opacity-50" />
                          </div>
                        ) : (
                          <img src={media.src} alt={media.alt} className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-[#4A90D9] mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Caractéristiques Techniques
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  {techSpecs.map((spec: any, idx: number) => (
                    <div key={idx} className={`flex justify-between py-2 border-b border-gray-100 ${spec.highlight ? 'bg-blue-50/50 px-2 rounded-lg' : ''}`}>
                      <span className={spec.highlight ? "font-bold text-[#4A90D9]" : "font-medium text-gray-900"}>{spec.label}</span>
                      <span className={`text-right ${spec.highlight ? 'font-bold text-[#4A90D9]' : ''}`}>{spec.value}</span>
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#4A90D9] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Premium
                  </span>
                </div>
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
                    <div className="grid grid-cols-3 gap-3">
                      {sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${
                            selectedSize?.id === size.id
                              ? "border-[#4A90D9] bg-blue-50 text-[#4A90D9]"
                              : "border-gray-100 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {size.name.split(' (')[0]}
                          <span className="block text-xs font-normal opacity-80 mt-1">
                            {size.name.includes('(') ? size.name.split(' (')[1].replace(')', '') : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options Selector */}
                {options.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                      <Check className="w-5 h-5 mr-2 text-blue-600" />
                      Options disponibles
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
                                ? "border-[#4A90D9] bg-blue-50/50"
                                : "border-gray-100 hover:border-gray-200"
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
                                <span className="text-sm font-bold text-[#4A90D9]">
                                  {option.price > 0 ? `+${formatPrice(option.price)}` : "Sur devis"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {/* CTA Button */}
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
