import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrixOuDevis from "@/components/PrixOuDevis";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { showCartNotification } from "@/components/CartNotification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Accessoires data — price = prix affiché (string), prixAchat = prix achat HT
const ACCESSORIES_DATA = [
  {
    id: "godet-dents",
    name: "Godet à dents",
    description: "Godet standard robuste pour tous types de travaux d'excavation. Disponible en plusieurs largeurs pour s'adapter à vos besoins.",
    image: "/images/accessories/tooth_bucket_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "20 cm", price: "191 €", prixAchat: 147 },
          { size: "60 cm", price: "182 €", prixAchat: 140 },
          { size: "80 cm", price: "269 €", prixAchat: 207 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "20 cm", price: "243 €", prixAchat: 187 },
          { size: "60 cm", price: "270 €", prixAchat: 208 },
          { size: "80 cm", price: "330 €", prixAchat: 254 }
        ]
      },
      {
        name: "R57 PRO",
        options: [
          { size: "20 cm", price: "261 €", prixAchat: 201 },
          { size: "60 cm", price: "330 €", prixAchat: 254 },
          { size: "80 cm", price: "391 €", prixAchat: 301 },
          { size: "100 cm", price: "413 €", prixAchat: 318 },
          { size: "120 cm", price: "452 €", prixAchat: 348 }
        ]
      }
    ]
  },
  {
    id: "godet-plat",
    name: "Godet de curage",
    description: "Idéal pour le nivellement, le nettoyage de fossés et les travaux de finition. Conception large pour une efficacité maximale.",
    image: "/images/accessories/flat_bucket_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "30 cm", price: "91 €", prixAchat: 70 },
          { size: "60 cm", price: "243 €", prixAchat: 187 },
          { size: "80 cm", price: "270 €", prixAchat: 208 },
          { size: "100 cm", price: "287 €", prixAchat: 221 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "30 cm", price: "243 €", prixAchat: 187 },
          { size: "60 cm", price: "270 €", prixAchat: 208 },
          { size: "80 cm", price: "296 €", prixAchat: 228 },
          { size: "100 cm", price: "330 €", prixAchat: 254 }
        ]
      },
      {
        name: "R57 PRO",
        options: [
          { size: "30 cm", price: "261 €", prixAchat: 201 },
          { size: "60 cm", price: "278 €", prixAchat: 214 },
          { size: "80 cm", price: "313 €", prixAchat: 241 },
          { size: "100 cm", price: "348 €", prixAchat: 268 }
        ]
      }
    ]
  },
  {
    id: "godet-inclinable",
    name: "Godet inclinable",
    description: "Permet d'incliner le godet pour les travaux sur terrains en pente ou pour créer des formes complexes.",
    image: "/images/accessories/tilt_bucket_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "80 cm", price: "435 €", prixAchat: 335 },
          { size: "100 cm", price: "452 €", prixAchat: 348 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "80 cm", price: "461 €", prixAchat: 355 },
          { size: "100 cm", price: "478 €", prixAchat: 368 }
        ]
      },
      {
        name: "R57 PRO",
        options: [
          { size: "80 cm", price: "748 €", prixAchat: 575 },
          { size: "100 cm", price: "809 €", prixAchat: 622 }
        ]
      }
    ]
  },
  {
    id: "attache-rapide",
    name: "Attache rapide Hydraulique",
    description: "Changez d'accessoire en quelques secondes sans quitter la cabine. Indispensable pour la polyvalence.",
    image: "/images/accessories/grapple_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "Standard", price: "452 €", prixAchat: 348 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "Standard", price: "513 €", prixAchat: 395 }
        ]
      }
    ]
  },
  {
    id: "pince-pouce",
    name: "Pince-pouce Hydraulique",
    description: "Transformez votre godet en pince pour manipuler des rochers, des souches et d'autres objets encombrants.",
    image: "/images/accessories/grapple_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "Standard", price: "522 €", prixAchat: 402 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "Standard", price: "565 €", prixAchat: 435 }
        ]
      }
    ]
  },
  {
    id: "rateau",
    name: "Râteau",
    description: "Pour le nettoyage de terrain, le ramassage de débris végétaux et la préparation du sol.",
    image: "/images/accessories/rake_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "40 cm", price: "217 €", prixAchat: 167 },
          { size: "60 cm", price: "235 €", prixAchat: 181 },
          { size: "80 cm", price: "261 €", prixAchat: 201 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "40 cm", price: "243 €", prixAchat: 187 },
          { size: "60 cm", price: "261 €", prixAchat: 201 },
          { size: "80 cm", price: "287 €", prixAchat: 221 }
        ]
      },
      {
        name: "R57 PRO",
        options: [
          { size: "40 cm", price: "209 €", prixAchat: 161 },
          { size: "60 cm", price: "235 €", prixAchat: 181 },
          { size: "80 cm", price: "261 €", prixAchat: 201 }
        ]
      }
    ]
  },
  {
    id: "ripper",
    name: "Ripper",
    description: "Dent de dérochage pour sols durs, gelés ou pour l'extraction de racines et de pierres.",
    image: "/images/accessories/ripper_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "Standard", price: "183 €", prixAchat: 141 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "Standard", price: "209 €", prixAchat: 161 }
        ]
      }
    ]
  },
  {
    id: "marteau-hydraulique",
    name: "Marteau hydraulique (Destructeur)",
    description: "Puissant brise-roche pour la démolition de béton, d'asphalte et de roche.",
    image: "/images/accessories/hydraulic_hammer_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "Standard", price: "452 €", prixAchat: 348 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "Standard", price: "504 €", prixAchat: 388 }
        ]
      },
      {
        name: "R57 PRO",
        options: [
          { size: "Standard", price: "669 €", prixAchat: 515 }
        ]
      }
    ]
  },
  {
    id: "tariere",
    name: "Tarière (Foret à terre)",
    description: "Pour le forage de trous de poteaux, de plantations ou de fondations.",
    image: "/images/accessories/auger_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "Ø 80 mm – 20 cm", price: "330 €", prixAchat: 254 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "Ø 80 mm – 20 cm", price: "373 €", prixAchat: 287 }
        ]
      }
    ]
  },
  {
    id: "grappin",
    name: "Grappin",
    description: "Outil polyvalent pour la manutention de bois, de pierres et de déchets de démolition.",
    image: "/images/accessories/grapple_r18.webp",
    models: [
      {
        name: "R22 PRO",
        options: [
          { size: "Standard", price: "330 €", prixAchat: 254 }
        ]
      },
      {
        name: "R32 PRO",
        options: [
          { size: "Standard", price: "365 €", prixAchat: 281 }
        ]
      },
      {
        name: "R57 PRO",
        options: [
          { size: "Standard", price: "748 €", prixAchat: 575 }
        ]
      }
    ]
  }
];

export default function Accessories() {
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const [, setLocation] = useLocation();

  const filteredAccessories = selectedModel === "all" 
    ? ACCESSORIES_DATA 
    : ACCESSORIES_DATA.filter(acc => acc.models.some(m => m.name === selectedModel));

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
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Tarifs par modèle (HT)</h4>
                    
                    {accessory.models.map((model) => (
                      (!selectedModel || selectedModel === "all" || selectedModel === model.name) && (
                        <div key={model.name} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white bg-[#4A90D9] px-2 py-0.5 rounded-lg">{model.name}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {model.options.map((option, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded group/option hover:bg-gray-100 transition-colors">
                                <span className="text-gray-600">{option.size}</span>
                                <div className="flex items-center gap-3">
                                  <PrixOuDevis prixAchat={option.prixAchat} compact />
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
