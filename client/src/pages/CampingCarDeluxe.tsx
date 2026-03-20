import { useState } from "react";
import { Check, Truck, ArrowRight, ShieldCheck, Zap, BatteryCharging, Gauge, Maximize, Play, Info, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { showCartNotification } from "@/components/CartNotification";
import PrixOuDevis from "@/components/PrixOuDevis";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Pricing data
const BASE_PRICE = 53650;

const DESTINATIONS = [
  { id: "mq", name: "Martinique (Port de Fort-de-France)", price: 9500 },
  { id: "gp", name: "Guadeloupe (Port de Pointe-à-Pitre)", price: 8650 },
  { id: "gf", name: "Guyane (Port de Dégrad des Cannes)", price: null }, // Sur devis
  { id: "re", name: "La Réunion (Port de la Pointe des Galets)", price: null }, // Sur devis
  { id: "yt", name: "Mayotte (Port de Longoni)", price: null }, // Sur devis
];

const IMAGES = [
  { type: 'video', src: '/images/products/camping_car/video_tour.mp4', alt: 'Visite virtuelle vidéo' },
  { type: 'image', src: '/images/products/camping_car/exterior_main.webp', alt: 'Vue Principale' },
  { type: 'image', src: '/images/products/camping_car/exterior_front_side.jpg', alt: 'Vue avant 3/4' },
  { type: 'image', src: '/images/products/camping_car/exterior_side.jpg', alt: 'Vue latérale' },
  { type: 'image', src: '/images/products/camping_car/exterior_back.jpg', alt: 'Vue arrière' },
  { type: 'image', src: '/images/products/camping_car/interior_overview.jpg', alt: 'Vue intérieure globale' },
  { type: 'image', src: '/images/products/camping_car/interior_living.jpg', alt: 'Espace de vie' },
  { type: 'image', src: '/images/products/camping_car/dining_area.jpg', alt: 'Coin repas' },
  { type: 'image', src: '/images/products/camping_car/kitchen.jpg', alt: 'Cuisine équipée' },
  { type: 'image', src: '/images/products/camping_car/bedroom.jpg', alt: 'Espace nuit' },
  { type: 'image', src: '/images/products/camping_car/bathroom.jpg', alt: 'Salle de bain' },
  { type: 'image', src: '/images/products/camping_car/laundry.jpg', alt: 'Espace buanderie' },
];

export default function CampingCarDeluxe() {
  const [selectedDestination, setSelectedDestination] = useState(DESTINATIONS[0]);
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    addToCart({
      id: "camping-car-deluxe",
      name: "Camping Car Deluxe Hybride",
      price: formatPrice(BASE_PRICE),
      image: "/images/products/camping_car/exterior_main.webp",
      type: "machine",
    });
    showCartNotification("Camping Car Deluxe Hybride");
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
            <span className="text-gray-900 font-medium">Camping Car Deluxe</span>
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
                              className="w-full h-full object-contain"
                              poster="/images/products/camping_car/exterior_front_side.jpg"
                            >
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
                  Photos non contractuelles. Le modèle présenté inclut des options de série haut de gamme.
                </div>
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                  <BatteryCharging className="h-6 w-6 text-[#4A90D9]" />
                  <span className="font-bold text-[#4A90D9] text-sm">Hybride</span>
                  <span className="text-[10px] text-gray-600">Essence + Électrique</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                  <Gauge className="h-6 w-6 text-[#ff6d00]" />
                  <span className="font-bold text-[#ff6d00] text-sm">Autonomie</span>
                  <span className="text-[10px] text-gray-600">Longue distance</span>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                  <Zap className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-green-600 text-sm">Énergie</span>
                  <span className="text-[10px] text-gray-600">Batterie 18.3kWh</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                  <Maximize className="h-6 w-6 text-purple-600" />
                  <span className="font-bold text-purple-600 text-sm">Espace</span>
                  <span className="text-[10px] text-gray-600">6 Places</span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-[#4A90D9] mb-6 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Caractéristiques Techniques
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Modèle</span>
                    <span className="text-right">BYD T5DM</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Dimensions</span>
                    <span className="text-right">5995 × 2300 × 3200 mm</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Moteur Thermique</span>
                    <span className="text-right">Essence 1.5T (146 ch)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Moteur Électrique</span>
                    <span className="text-right">150 kW (204 ch)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 bg-blue-50/50 px-2 rounded-lg">
                    <span className="font-bold text-[#4A90D9]">Batterie Lame</span>
                    <span className="text-right font-bold text-[#4A90D9]">18.3 kWh (Standard)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Réservoir Eau Propre</span>
                    <span className="text-right">350 L</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Onduleur</span>
                    <span className="text-right">6000 W</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-900">Climatisation</span>
                    <span className="text-right">220V Incluse</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Configuration & Pricing */}
            <div>
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-blue-50 sticky top-24">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#ff6d00] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Nouveauté
                  </span>
                  <span className="px-3 py-1 bg-[#4A90D9] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Premium
                  </span>
                </div>
                <h1 className="text-3xl font-serif font-bold text-[#4A90D9] mb-2">
                  Camping Car Deluxe Hybride
                </h1>
                <p className="text-gray-500 mb-6">
                  L'alliance parfaite de l'autonomie et du confort pour vos aventures.
                </p>

                <div className="mb-8">
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Prix de base (HT)</span>
                  <div className="mt-2">
                    <PrixOuDevis prixAchat={41269} />
                  </div>
                </div>

                <Separator className="my-6" />

                {/* CTA */}
                <div className="space-y-4">
                  <Button
                    onClick={handleAddToCart}
                    className="w-full h-14 text-lg font-bold bg-[#4A90D9] hover:bg-[#3A7BC8] shadow-lg shadow-blue-900/20"
                  >
                    <ShoppingCart className="mr-2 w-5 h-5" />
                    Ajouter dans le panier
                  </Button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                    *Le prix final sera confirmé par devis officiel. Garantie constructeur incluse.
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
