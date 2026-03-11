import { useState, useEffect } from "react";
import { Check, Truck, ArrowRight, ShieldCheck, Ruler, Home, Sun, Snowflake, Sofa, BedDouble, PaintBucket, FileText, Info, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { showCartNotification } from "@/components/CartNotification";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Pricing data extracted from screenshots
const SIZES = [
  {
    id: "20ft",
    name: "20 Pieds (37m²)",
    price: 5600,
    approxM2: 40, // ~37m² → closest bracket 40m²
    shipping: { martinique: 5500, guadeloupe: 5500 }
  },
  {
    id: "30ft",
    name: "30 Pieds (57m²)",
    price: 7400,
    approxM2: 60, // ~57m² → closest bracket 60m²
    shipping: { martinique: 9500, guadeloupe: 8650 }
  },
  {
    id: "40ft",
    name: "40 Pieds (74m²)",
    price: 9200,
    approxM2: 80, // ~74m² → closest bracket 80m²
    shipping: { martinique: 9500, guadeloupe: 8650 }
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
    volume: 0.8 // Estimated volume in m3
  },
  {
    id: "solar",
    name: "Kit Panneaux Solaires",
    description: "10kW autonome (16 panneaux 585W + onduleur hybride + batteries lithium 10kW)",
    price: 7912,
    icon: Sun,
    volume: 2.5 // Estimated volume in m3
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

// Media array for Carousel: Videos first, then Exterior images
const IMAGES = [
  // Videos
  { type: 'video', src: '/images/products/modular_standard/video_2.mov', alt: 'Visite vidéo 2' },
  { type: 'video', src: '/images/products/modular_standard/video_3.mov', alt: 'Visite vidéo 3' },
  // Exterior Images
  { type: 'image', src: '/images/products/modular_standard/exterior_1.jpeg', alt: 'Maison Modulaire Extérieur 1' },
  { type: 'image', src: '/images/products/modular_standard/exterior_2.jpeg', alt: 'Maison Modulaire Extérieur 2' },
  { type: 'image', src: '/images/products/modular_standard/exterior_3.jpeg', alt: 'Maison Modulaire Extérieur 3' },
  { type: 'image', src: '/images/products/modular_standard/exterior_4.jpeg', alt: 'Maison Modulaire Extérieur 4' },
  { type: 'image', src: '/images/products/modular_standard/exterior_5.jpeg', alt: 'Maison Modulaire Extérieur 5' },
  { type: 'image', src: '/images/products/modular_standard/exterior_6.jpeg', alt: 'Maison Modulaire Extérieur 6' },
  { type: 'image', src: '/images/products/modular_standard/exterior_7.jpeg', alt: 'Maison Modulaire Extérieur 7' },
];

export default function ModularStandard() {
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();

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
  }, [selectedSize, selectedOptions]);

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
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const selectedOptionNames = selectedOptions.map(optId => {
      const opt = OPTIONS.find(o => o.id === optId);
      return opt?.name || optId;
    });

    addToCart({
      id: `maison-standard-${selectedSize.id}`,
      name: `Maison Modulaire Standard - ${selectedSize.name}`,
      price: formatPrice(totalPrice),
      image: IMAGES.find(img => img.type === 'image')?.src || "",
      type: "house",
      houseConfig: {
        size: selectedSize.name,
        options: selectedOptionNames,
      },
    });
    showCartNotification(`Maison Modulaire Standard - ${selectedSize.name}`);
  };

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
                    {IMAGES.map((media, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[4/3] relative flex items-center justify-center bg-black">
                          {media.type === 'video' ? (
                            <video 
                              controls 
                              muted
                              className="w-full h-full object-contain"
                              poster={IMAGES.find(img => img.type === 'image')?.src}
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
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Structure</span>
                    <span className="text-right">Acier galvanisé 2.5mm (Poutres 80x100mm)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Isolation Murs</span>
                    <span className="text-right">Panneaux sandwich EPS 75mm (Ignifuge)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Isolation Toiture</span>
                    <span className="text-right">EPS 50mm + Tôle 0.45mm</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Sol</span>
                    <span className="text-right">Structure ciment 18mm + Revêtement PVC 2mm</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Menuiseries</span>
                    <span className="text-right">Porte Alu RPT + Double vitrage 5+12+5</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Électricité</span>
                    <span className="text-right">Tableau (1 diff + 3 disj), Prise CEE 32A, LED</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Résistance</span>
                    <span className="text-right">Vent 0.60 kN/m² / Séisme Niveau 8</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Cuisine (Incluse)</span>
                    <span className="text-right max-w-[50%]">Meuble en L, plan de travail, robinet, évier</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Sanitaire (Inclus)</span>
                    <span className="text-right">Douche + WC + Vasque</span>
                  </div>
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

                <div className="mt-6">
                  <a 
                    href="/docs/fiche_technique_maison_modulaire.pdf" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:border-[#4A90D9] hover:text-[#4A90D9] transition-colors"
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
                <h1 className="text-3xl font-serif font-bold text-[#4A90D9] mb-2">
                  Maison Modulaire Standard
                </h1>
                <p className="text-gray-500 mb-6">
                  La solution idéale pour un habitat rapide, économique et durable.
                </p>

                <div className="mb-8">
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Prix de base (HT)</span>
                  <div className="text-4xl font-bold text-[#4A90D9]">
                    {formatPrice(totalPrice)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Prix de base hors taxes et hors livraison</p>
                </div>

                <Separator className="my-6" />

                {/* Size Selector */}
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2 text-blue-600" />
                    Choisir la taille
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedSize.id === size.id
                            ? "border-[#4A90D9] bg-blue-50 text-[#4A90D9]"
                            : "border-gray-200 text-gray-600 hover:border-blue-200"
                        }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options Selector */}
                <div className="mb-8">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                    <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                    Options & Équipements
                  </h4>
                  <div className="space-y-3">
                    {OPTIONS.map((option) => (
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
                          <option.icon className="w-4 h-4" />
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
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                  <Button
                    onClick={handleAddToCart}
                    className="w-full h-14 text-lg font-bold bg-[#4A90D9] hover:bg-[#3A7BC8] shadow-lg shadow-blue-900/20 rounded-xl"
                  >
                    <ShoppingCart className="mr-2 w-5 h-5" />
                    Ajouter dans le panier
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
