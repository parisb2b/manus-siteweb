import { useState, useEffect, useRef } from "react";
import { Check, Truck, ArrowRight, ShieldCheck, Ruler, Home, Sun, Snowflake, Sofa, BedDouble, PaintBucket, FileText, Info, Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Pricing data for Premium models
const SIZES = [
  {
    id: "20ft",
    name: "20 Pieds (37m²)",
    price: 9920,
    shipping: { martinique: 11000, guadeloupe: 11000 } // Double shipping (2x20ft or 2x40ft)
  },
  {
    id: "30ft",
    name: "30 Pieds (57m²)",
    price: 10700,
    shipping: { martinique: 19000, guadeloupe: 17300 } // Double shipping (2x40ft)
  },
  {
    id: "40ft",
    name: "40 Pieds (74m²)",
    price: 13300,
    shipping: { martinique: 19000, guadeloupe: 17300 } // Double shipping (2x40ft)
  }
];

const OPTIONS = [
  {
    id: "extra_room",
    name: "Chambre Supplémentaire",
    description: "Ajout d'une cloison et porte pour créer une chambre additionnelle",
    price: 0, // Sur devis
    icon: BedDouble,
    isQuote: true,
    volume: 0 // No significant volume
  },
  {
    id: "ac",
    name: "Climatisation",
    description: "Pack climatisation tri-split 5.2kW (MIDEA ou équivalent)",
    price: 2500,
    icon: Snowflake,
    volume: 0 // Fits in second container
  },
  {
    id: "solar",
    name: "Kit Panneaux Solaires",
    description: "10kW autonome (16 panneaux 585W + onduleur hybride + batteries lithium 10kW)",
    price: 7912,
    icon: Sun,
    volume: 0 // Fits in second container
  },
  {
    id: "furniture",
    name: "Pack Meubles",
    description: "Mobilier de base (Sur demande)",
    price: 0, // Sur demande
    icon: Sofa,
    isQuote: true,
    volume: 0 // Quote based
  }
];

const DESTINATIONS = [
  { id: "mq", name: "Martinique (Port de Fort-de-France)" },
  { id: "gp", name: "Guadeloupe (Port de Pointe-à-Pitre)" },
  { id: "gf", name: "Guyane (Port de Dégrad des Cannes)" },
  { id: "re", name: "La Réunion (Port de la Pointe des Galets)" },
  { id: "yt", name: "Mayotte (Port de Longoni)" },
];

const IMAGES = [
  { type: 'video', src: '/images/products/modular_premium/video_1.mov', alt: 'Visite Virtuelle Premium 1' },
  { type: 'video', src: '/images/products/modular_premium/video_2.mov', alt: 'Visite Virtuelle Premium 2' },
  { type: 'image', src: '/images/products/modular_premium/exterior_1.jpg', alt: 'Vue Extérieure 1' },
  { type: 'image', src: '/images/products/modular_premium/exterior_2.jpg', alt: 'Vue Extérieure 2' },
  { type: 'image', src: '/images/products/modular_premium/exterior_3.jpg', alt: 'Vue Extérieure 3' },
  { type: 'image', src: '/images/products/modular_premium/exterior_4.jpg', alt: 'Vue Extérieure 4' },
];

export default function ModularPremium() {
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState(DESTINATIONS[0]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let price = selectedSize.price;
    
    // Add options price
    selectedOptions.forEach(optId => {
      const option = OPTIONS.find(o => o.id === optId);
      if (option && !option.isQuote) {
        price += option.price;
      }
    });

    setTotalPrice(price);

    // Calculate shipping based on advanced rules (Double Container for Premium)
    if (selectedDestination.id === "mq" || selectedDestination.id === "gp") {
      let baseShipping = 0;
      
      // 1. Base shipping based on house size (Double container required)
      if (selectedSize.id === "20ft") {
        // 20ft house requires 2x 20ft containers (one for house, one for roof/terrace)
        baseShipping = selectedDestination.id === "mq" ? 5500 * 2 : 5500 * 2;
      } else {
        // 30ft and 40ft houses require 2x 40ft containers
        baseShipping = selectedDestination.id === "mq" ? 9500 * 2 : 8650 * 2;
      }

      // 2. Options fit in the second container, so NO extra volume cost
      setShippingPrice(baseShipping);
    } else {
      setShippingPrice(null); // Sur devis for other destinations
    }

  }, [selectedSize, selectedOptions, selectedDestination]);

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

  // Carousel Logic
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % IMAGES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);
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
    if (IMAGES[currentSlide].type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [currentSlide]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4">
          
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-8">
            <a href="/" className="hover:text-[#1a237e]">Accueil</a> <span className="mx-2">/</span>
            <a href="/maisons" className="hover:text-[#1a237e]">Maisons Modulaires</a> <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Premium</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Left Column: Images & Details */}
            <div>
              {/* Media Carousel */}
              <div className="bg-black rounded-3xl overflow-hidden shadow-lg mb-8 relative aspect-video group">
                {IMAGES[currentSlide].type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={IMAGES[currentSlide].src}
                    className="w-full h-full object-contain"
                    loop
                    muted={isMuted}
                    playsInline
                    autoPlay
                  />
                ) : (
                  <img 
                    src={IMAGES[currentSlide].src} 
                    alt={IMAGES[currentSlide].alt} 
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
                {IMAGES[currentSlide].type === 'video' && (
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
                  {currentSlide + 1} / {IMAGES.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {IMAGES.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentSlide === idx ? 'border-[#1a237e] ring-2 ring-[#1a237e]/20' : 'border-transparent opacity-70 hover:opacity-100'
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

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-[#1a237e] mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Caractéristiques Techniques
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between py-2 border-b border-gray-100 bg-blue-50/50 px-2 rounded-lg">
                    <span className="font-bold text-[#1a237e]">Toiture & Terrasse</span>
                    <span className="text-right font-bold text-[#1a237e]">Toit double pente + Terrasse avant inclus</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Structure</span>
                    <span className="text-right">Acier galvanisé renforcé (Poutres 100x100mm)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Isolation Murs</span>
                    <span className="text-right">Panneaux sandwich PU 75mm (Haute densité)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Isolation Toiture</span>
                    <span className="text-right">Laine de verre 100mm + Tuiles acier</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Sol</span>
                    <span className="text-right">Parquet stratifié haute résistance</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Menuiseries</span>
                    <span className="text-right">Baies vitrées Alu double vitrage thermique</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Électricité</span>
                    <span className="text-right">Installation complète norme NF, spots LED encastrés</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Résistance</span>
                    <span className="text-right">Vent 0.80 kN/m² / Séisme Niveau 9</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Cuisine (Incluse)</span>
                    <span className="text-right max-w-[50%]">Cuisine Premium avec îlot central (selon plan)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Sanitaire (Inclus)</span>
                    <span className="text-right">Douche italienne + WC suspendu + Meuble vasque</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-[#1a237e] mb-2 flex items-center text-sm">
                    <PaintBucket className="w-4 h-4 mr-2" />
                    Personnalisation
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Le choix des finitions (revêtements intérieur/extérieur, couleurs) se fait après validation de la commande. 
                    Toute autre personnalisation est possible sur devis.
                  </p>
                </div>

                <div className="mt-6">
                  <a 
                    href="/docs/fiche_technique_maison_modulaire.pdf" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:border-[#1a237e] hover:text-[#1a237e] transition-colors"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Télécharger la Fiche Technique (PDF)
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Configuration & Pricing */}
            <div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-blue-50 sticky top-24">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#1a237e] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Premium
                  </span>
                </div>
                <h1 className="text-3xl font-serif font-bold text-[#1a237e] mb-2">
                  Maison Modulaire Premium
                </h1>
                <p className="text-gray-500 mb-6">
                  Le confort absolu avec toit en pente et terrasse intégrée.
                </p>

                <div className="mb-8">
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Prix de base (HT)</span>
                  <div className="text-4xl font-bold text-[#1a237e]">
                    {formatPrice(totalPrice)}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Size Selector */}
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-blue-600" />
                    Choisir la taille
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          selectedSize.id === size.id
                            ? "border-[#1a237e] bg-blue-50 text-[#1a237e]"
                            : "border-gray-100 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {size.name.split(' (')[0]}
                        <span className="block text-xs font-normal opacity-80 mt-1">
                          {size.name.split(' (')[1].replace(')', '')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options Selector */}
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Check className="w-5 h-5 mr-2 text-blue-600" />
                    Options disponibles
                  </h4>
                  <div className="space-y-3">
                    {OPTIONS.map((option) => (
                      <div 
                        key={option.id}
                        onClick={() => toggleOption(option.id)}
                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedOptions.includes(option.id)
                            ? "border-[#1a237e] bg-blue-50/50"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className={`mt-1 mr-4 p-2 rounded-full ${
                          selectedOptions.includes(option.id) ? "bg-[#1a237e] text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                          <option.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${selectedOptions.includes(option.id) ? "text-[#1a237e]" : "text-gray-700"}`}>
                              {option.name}
                            </span>
                            <span className="text-sm font-bold text-[#1a237e]">
                              {option.price > 0 ? `+${formatPrice(option.price)}` : "Sur devis"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Shipping Calculator */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-blue-600" />
                    Estimation Livraison
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Destination
                      </label>
                      <select 
                        className="w-full p-3 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:ring-2 focus:ring-[#1a237e] focus:border-transparent outline-none appearance-none"
                        value={selectedDestination.id}
                        onChange={(e) => setSelectedDestination(DESTINATIONS.find(d => d.id === e.target.value) || DESTINATIONS[0])}
                      >
                        {DESTINATIONS.map(dest => (
                          <option key={dest.id} value={dest.id}>{dest.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-gray-600">Frais de port estimés</span>
                      <span className="text-xl font-bold text-[#1a237e]">
                        {shippingPrice !== null ? formatPrice(shippingPrice) : "Sur devis"}
                      </span>
                    </div>
                    
                    {shippingPrice !== null && (
                      <p className="text-xs text-gray-500 italic">
                        *Inclut 2 conteneurs (Maison + Toiture/Terrasse). Hors douane et octroi de mer.
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button className="w-full h-14 text-lg font-bold bg-[#1a237e] hover:bg-[#0d1b60] shadow-lg shadow-blue-900/20 rounded-xl">
                  Demander un devis complet
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  Réponse sous 24h ouvrées. Sans engagement.
                </p>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
