import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { Minus, Plus, Check, FileText, ShoppingCart, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { showCartNotification } from "@/components/CartNotification";

// Images mapping (main images)
const productImages: Record<string, string> = {
  "r18-pro": "/images/products/r18_pro/r18_pro_main_view.webp",
  "r22-pro": "/images/products/r22_pro/r22_pro_main_view.webp",
  "r32-pro": "/images/products/r32_pro/r32_pro_main_view.webp",
  "r57-pro": "/images/products/r57_pro/r57_pro_main_view.png",
};

// Gallery images mapping
const productGalleries: Record<string, string[]> = {
  "r18-pro": [
    "/images/products/r18_pro/r18_pro_main_view.webp",
    "/images/products/r18_pro/r18_pro_side_view.webp",
    "/images/products/r18_pro/r18_pro_rear_view.webp",
    "/images/products/r18_pro/r18_pro_cab_view.webp",
  ],
  "r22-pro": [
    "/images/products/r22_pro/r22_pro_main_view.webp",
    "/images/products/r22_pro/r22_pro_side_view.webp",
    "/images/products/r22_pro/r22_pro_rear_view.webp",
    "/images/products/r22_pro/r22_pro_cab_view.webp",
  ],
  "r32-pro": [
    "/images/products/r32_pro/r32_pro_main_view.webp",
    "/images/products/r32_pro/r32_pro_side_view.webp",
    "/images/products/r32_pro/r32_pro_rear_view.webp",
    "/images/products/r32_pro/r32_pro_cab_view.webp",
  ],
  "r57-pro": [
    "/images/products/r57_pro/r57_pro_main_view.png",
  ],
};

const PRODUCTS_DATA: Record<string, any> = {
  "r18-pro": {
    id: "r18-pro",
    name: "R18 PRO",
    price: "12 400,00 EUR HT",
    description: "Le Rippa R18 PRO est une mini-pelle puissante et polyvalente, idéale pour les projets de construction exigeants, l’aménagement paysager et les travaux de terrassement de précision. Grâce à sa conception robuste et à son moteur diesel Kubota performant, elle allie efficacité, précision et fiabilité professionnelle. Avec un poids opérationnel de 1.806 kg et une profondeur de creusement de 2,42 mètres, la R18 PRO est parfaitement équipée pour les utilisations intensives et offre des performances constantes même sous forte charge.",
    pdf: "/documents/r18_pro_fiche_technique.pdf",
    specs: {
      weight: "1806 kg",
      power: "20 PS / 15 kW",
      depth: "2.42 m",
      width: "1092 mm",
      engine: "Kubota D902"
    },
    features: [
      "Godet denté de 40 cm pour un creusement précis",
      "Moteur diesel Kubota puissant (certifié Euro 5)",
      "Conception robuste pour une stabilité maximale",
      "Grande profondeur de creusement pour un usage professionnel"
    ]
  },
  "r22-pro": {
    id: "r22-pro",
    name: "R22 PRO",
    price: "15 795,00 EUR HT",
    description: "Le Rippa R22 PRO est une mini-pelle puissante et polyvalente, idéale pour les projets de construction et d’aménagement paysager de taille moyenne à grande. Grâce à sa conception robuste et à son moteur diesel Kubota performant, elle allie efficacité, précision et fiabilité pour une utilisation professionnelle. Avec un poids opérationnel de 2 371,5 kg, une profondeur de creusement de 2,29 mètres et une force de creusement de 18,4 kN, la R22 PRO exécute sans effort les tâches les plus exigeantes tout en offrant un contrôle optimal à chaque mouvement.",
    pdf: "/documents/r22_pro_fiche_technique.pdf",
    specs: {
      weight: "2371,5 kg",
      power: "24.8 PS / 18.2 kW",
      depth: "2.29 m",
      width: "1300 mm",
      engine: "Kubota D1105"
    },
    features: [
      "Godet denté de 40 cm pour un creusement précis",
      "Moteur diesel Kubota puissant (certifié Euro 5)",
      "Force de creusement élevée pour une performance optimale",
      "Structure robuste pour une longue durée de vie"
    ]
  },
  "r32-pro": {
    id: "r32-pro",
    name: "R32 PRO",
    price: "18 585,00 EUR HT",
    description: "Le Rippa R32 PRO est une mini-pelle professionnelle haute performance, idéale pour les grands projets de construction, les travaux d'excavation profonds et les opérations de terrassement exigeantes. Avec sa combinaison de puissance massive, de contrôle précis et de conception robuste, c'est le choix parfait pour les professionnels qui apprécient l'efficacité et la durabilité. Propulsée par un puissant moteur diesel Kubota, la R32 PRO offre des performances exceptionnelles avec un poids opérationnel de 3 375 kg, une profondeur de creusement de 2,83 mètres et une force de creusement de 27 kN – assurant une productivité maximale pour chaque tâche.",
    pdf: "/documents/r32_pro_fiche_technique.pdf",
    specs: {
      weight: "3200 kg",
      power: "25 PS / 18.5 kW",
      depth: "2.83 m",
      width: "1500 mm",
      engine: "Kubota V1505"
    },
    features: [
      "Godet denté de 40 cm pour un creusement précis",
      "Moteur diesel Kubota puissant (certifié Euro 5)",
      "Force de creusement élevée pour les travaux lourds",
      "Conception robuste pour une utilisation professionnelle durable"
    ]
  },
  "r57-pro": {
    id: "r57-pro",
    name: "R57 PRO",
    price: "25 900,00 EUR HT",
    description: "La Rippa R57 PRO est une mini-pelle de 5,7 tonnes conçue pour offrir une puissance et une efficacité maximales. Équipée d'un moteur Kubota V2607 fiable et performant, elle garantit une productivité élevée pour les travaux de construction, de terrassement et d'aménagement paysager les plus exigeants. Avec une profondeur de fouille de près de 3,9 mètres et une cabine confortable climatisée, la R57 PRO est l'outil ultime pour les professionnels.",
    pdf: "/documents/r57_pro_fiche_technique.pdf",
    specs: {
      weight: "5700 kg",
      power: "36.5 kW / 50 HP",
      depth: "3.89 m",
      width: "1960 mm",
      engine: "Kubota V2607"
    },
    features: [
      "Moteur Kubota V2607 puissant et fiable",
      "Cabine fermée spacieuse avec climatisation",
      "Chenilles en caoutchouc pour une meilleure traction",
      "Ligne hydraulique auxiliaire pour accessoires"
    ]
  }
};

const specs: Record<string, any> = {
    "r18-pro": {
      "Paramètres de base": [
        { label: "Poids opérationnel", value: "1806 kg / 3982 lb" },
        { label: "Capacité du godet", value: "0,07 m³ / 2,47 ft³" },
        { label: "Vitesse de déplacement (basse/haute)", value: "0–1,8 / 3,0 km/h / 0–1,12 / 1,86 mph" },
        { label: "Pente franchissable", value: "30 %" },
        { label: "Pression au sol", value: "27,88 kPa / 4,04 psi" },
        { label: "Forces de creusement (godet / balancier)", value: "≈8,2 / 12,2 kN" },
        { label: "Rayon de fouille max.", value: "3970 mm / 156,3 in" },
        { label: "Profondeur de fouille max.", value: "2420 mm / 95,3 in" },
        { label: "Hauteur de fouille max.", value: "3400 mm / 133,9 in" },
        { label: "Hauteur de déversement max.", value: "2180 mm / 85,8 in" }
      ],
      "Moteur": [
        { label: "Marque", value: "Kubota" },
        { label: "Modèle", value: "D902" },
        { label: "Puissance max.", value: "20 PS / 20 hp" },
        { label: "Puissance nominale", value: "15 kW" },
        { label: "Régime max.", value: "2200 rpm" },
        { label: "Cylindrée", value: "1,813 L / 0,48 gal" },
        { label: "Nombre de cylindres", value: "3" },
        { label: "Refroidissement", value: "Refroidissement à eau + huile hydraulique" },
        { label: "Huile moteur (vidange)", value: "3,5 L / 0,92 gal" },
        { label: "Carburant", value: "Diesel" },
        { label: "Qualité de carburant", value: "No. 0 / -10" },
        { label: "Consommation théorique", value: "1,5–1,8 L/h / 0,40–0,48 gal/h" }
      ],
      "Dimensions": [
        { label: "Longueur de transport", value: "2527 mm / 99,5 in" },
        { label: "Largeur de transport", value: "1092 mm / 43,0 in" },
        { label: "Hauteur de transport", value: "2349 mm / 92,5 in" },
        { label: "Garde au sol (contrepoids)", value: "450 mm / 17,7 in" },
        { label: "Largeur du godet", value: "400 mm / 15,7 in" },
        { label: "Longueur de flèche", value: "1825 mm / 71,9 in" },
        { label: "Longueur du balancier", value: "1185 mm / 46,7 in" },
        { label: "Largeur de la lame", value: "990 mm / 39,0 in" }
      ],
      "Système hydraulique": [
        { label: "Pression nominale", value: "23 MPa" },
        { label: "Pression max. réglée", value: "18 MPa" },
        { label: "Débit max. de la pompe principale", value: "28 L/min" },
        { label: "Distributeur", value: "Distributeur hydraulique 9 voies (commande hydraulique)" },
        { label: "Marque du distributeur", value: "Taifeng Hydraulic" },
        { label: "Moteur de translation (type)", value: "LTM03C" },
        { label: "Marque moteur de translation", value: "LIKECHUAN" }
      ]
    },
    "r22-pro": {
      "Paramètres de base": [
        { label: "Poids opérationnel", value: "2371,5 kg / 5228 lb" },
        { label: "Capacité du godet", value: "0,049 m³ / 1,9 ft³" },
        { label: "Vitesse de déplacement (basse/haute)", value: "0–1,5 / 2,8 km/h / 0–0,93 / 1,71 mph" },
        { label: "Pente maximale", value: "30 %" },
        { label: "Pression au sol", value: "33,4 kPa / 4,84 psi" },
        { label: "Force de creusement max.", value: "18,4 kN" },
        { label: "Rayon de creusement max.", value: "4143 mm / 163,1 in" },
        { label: "Profondeur de creusement max.", value: "2293 mm / 90,3 in" },
        { label: "Hauteur de creusement max.", value: "3761 mm / 148,1 in" },
        { label: "Hauteur de déversement max.", value: "3496 mm / 138,9 in" },
        { label: "Écartement de voie (rétracté/étendu)", value: "1300–1500 mm / 51,2–59,1 in" }
      ],
      "Moteur": [
        { label: "Marque", value: "Kubota" },
        { label: "Modèle", value: "D1105" },
        { label: "Puissance max.", value: "≈24,8 hp" },
        { label: "Puissance nominale", value: "18,2 kW" },
        { label: "Régime max.", value: "3000 rpm" },
        { label: "Cylindrée", value: "1,23 L / 0,31 gal" },
        { label: "Nombre de cylindres", value: "3" },
        { label: "Refroidissement", value: "À eau" },
        { label: "Huile moteur (quantité de vidange)", value: "4,2 L / 1,1 gal" },
        { label: "Carburant", value: "Diesel" },
        { label: "Qualité de carburant", value: "No. 0 / -10" },
        { label: "Consommation théorique", value: "1,3–1,5 L/h / 0,34–0,40 gal/h" }
      ],
      "Dimensions": [
        { label: "Longueur de transport", value: "2824 mm / 111,2 in" },
        { label: "Largeur de transport", value: "1300 mm / 51,2 in" },
        { label: "Hauteur de transport", value: "2361 mm / 92,9 in" },
        { label: "Garde au sol min.", value: "450 mm / 17,7 in" },
        { label: "Largeur du godet", value: "450 mm / 17,7 in" },
        { label: "Longueur de flèche", value: "1825 mm / 71,9 in" },
        { label: "Longueur du balancier", value: "1185 mm / 46,7 in" },
        { label: "Largeur de la lame", value: "1300 mm / 51,2 in" }
      ],
      "Système hydraulique": [
        { label: "Pompe principale type/modèle", value: "Load sensitive variable piston pump / 28" },
        { label: "Marque de la pompe", value: "Taifeng" },
        { label: "Débit max.", value: "67,2 L/min" },
        { label: "Distributeur hydraulique", value: "9-way hydraulic multi-way valve" },
        { label: "Marque du distributeur", value: "Taifeng" },
        { label: "Pression nominale", value: "18 MPa" },
        { label: "Pression maximale", value: "20 MPa" },
        { label: "Moteur de translation (type)", value: "LTM03CDK" },
        { label: "Marque moteur de translation", value: "Likuchuan" }
      ]
    },
    "r32-pro": {
      "Paramètres de base": [
        { label: "Poids opérationnel", value: "3375 kg / 7441 lb" },
        { label: "Capacité du godet", value: "0,06 m³ / 2,12 ft³" },
        { label: "Vitesse de déplacement (basse/haute)", value: "0–2,2 / 4,2 km/h / 0–1,37 / 2,61 mph" },
        { label: "Pente maximale", value: "30 %" },
        { label: "Pression au sol", value: "33,7 kPa / 4,89 psi" },
        { label: "Force de creusement max.", value: "27 kN" },
        { label: "Rayon de creusement max.", value: "4845 mm / 190,7 in" },
        { label: "Profondeur de creusement max.", value: "2830 mm / 111,4 in" },
        { label: "Hauteur de creusement max.", value: "4530 mm / 178,3 in" },
        { label: "Hauteur de déversement max.", value: "3235 mm / 127,4 in" }
      ],
      "Moteur": [
        { label: "Marque", value: "Kubota" },
        { label: "Modèle", value: "V1505" },
        { label: "Puissance max.", value: "25 PS / 25 hp" },
        { label: "Puissance nominale", value: "18,5 kW" },
        { label: "Régime max.", value: "3000 rpm" },
        { label: "Cylindrée", value: "1,498 L / 0,40 gal" },
        { label: "Nombre de cylindres", value: "4" },
        { label: "Refroidissement", value: "Refroidissement à eau + huile hydraulique" },
        { label: "Huile moteur (vidange)", value: "5,7 L / 1,5 gal" },
        { label: "Carburant", value: "Diesel" },
        { label: "Qualité de carburant", value: "No. 0 / -10" },
        { label: "Consommation théorique", value: "1,5–1,8 L/h / 0,40–0,48 gal/h" }
      ],
      "Dimensions": [
        { label: "Longueur de transport", value: "4520 mm / 178,0 in" },
        { label: "Largeur de transport", value: "1500 mm / 59,1 in" },
        { label: "Hauteur de transport", value: "2465 mm / 97,0 in" },
        { label: "Garde au sol (contrepoids)", value: "553 mm / 21,8 in" },
        { label: "Largeur du godet", value: "520 mm / 20,5 in" },
        { label: "Longueur de flèche", value: "2280 mm / 89,8 in" },
        { label: "Longueur du balancier", value: "1480 mm / 58,3 in" },
        { label: "Largeur de la lame", value: "1500 mm / 59,1 in" }
      ],
      "Système hydraulique": [
        { label: "Pompe principale type/modèle", value: "Load sensitive variable piston pump / 36" },
        { label: "Marque de la pompe", value: "Hengli" },
        { label: "Débit max.", value: "86,4 L/min" },
        { label: "Distributeur hydraulique", value: "9-way hydraulic multi-way valve" },
        { label: "Marque du distributeur", value: "Hengli" },
        { label: "Pression nominale", value: "22 MPa" },
        { label: "Pression maximale", value: "25 MPa" },
        { label: "Moteur de translation (type)", value: "LTM04" },
        { label: "Marque moteur de translation", value: "LIKECHUAN" }
      ]
    },
    "r57-pro": {
      "Paramètres de base": [
        { label: "Poids opérationnel", value: "5700 kg" },
        { label: "Capacité du godet", value: "0,21 m³" },
        { label: "Vitesse de déplacement", value: "2,4 / 4,4 km/h" },
        { label: "Pente maximale", value: "35°" },
        { label: "Pression au sol", value: "32 kPa" },
        { label: "Force de creusement max.", value: "38 kN" },
        { label: "Profondeur de creusement max.", value: "3890 mm" },
        { label: "Hauteur de creusement max.", value: "5630 mm" },
        { label: "Hauteur de déversement max.", value: "3980 mm" }
      ],
      "Moteur": [
        { label: "Marque", value: "Kubota" },
        { label: "Modèle", value: "V2607" },
        { label: "Puissance", value: "36.5 kW / 50 HP" },
        { label: "Cylindrée", value: "2,615 L" },
        { label: "Refroidissement", value: "Liquide" },
        { label: "Carburant", value: "Diesel" }
      ],
      "Dimensions": [
        { label: "Longueur de transport", value: "5960 mm" },
        { label: "Largeur de transport", value: "1960 mm" },
        { label: "Hauteur de transport", value: "2620 mm" },
        { label: "Largeur de la lame", value: "1960 mm" }
      ],
      "Système hydraulique": [
        { label: "Type de pompe", value: "Pompe à pistons axiaux" },
        { label: "Débit max.", value: "148 L/min" },
        { label: "Pression de travail", value: "24.5 MPa" }
      ]
    }
};

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const productId = match && params ? params.id : null;
  const product = productId ? PRODUCTS_DATA[productId] : null;
  const productSpecs = productId ? specs[productId] : null;
  const { addToCart } = useCart();
  
  // Use a default image if not found in mapping
  const mainImage = productId && productImages[productId] 
    ? productImages[productId] 
    : "/images/placeholder.jpg";
    
  // Use gallery if available, otherwise fallback to main image array
  const galleryImages = productId && productGalleries[productId]
    ? productGalleries[productId]
    : [mainImage];
    
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-[#1a1a5e] mb-4">Produit non trouvé</h1>
            <Button onClick={() => setLocation("/")} className="btn-rippa">
              Retour à l'accueil
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: productId ? productImages[productId] || "/images/placeholder.jpg" : "/images/placeholder.jpg",
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
            <a href="/" className="hover:text-[#1a1a5e]">Accueil</a>
            <span className="mx-2">/</span>
            <a href="/#minipelles" className="hover:text-[#1a1a5e]">Mini-pelles</a>
            <span className="mx-2">/</span>
            <span className="text-[#1a1a5e] font-medium">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-8 aspect-[4/3] flex items-center justify-center border border-gray-100 relative overflow-hidden group">
                <img 
                  src={galleryImages[activeImage]} 
                  alt={`${product.name} vue ${activeImage + 1}`}
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
                        activeImage === index ? "border-[#1a1a5e] ring-1 ring-[#1a1a5e]" : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} miniature ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <span className="text-[#1a1a5e] font-bold tracking-widest uppercase text-sm mb-2 block">Mini-pelle Série Pro</span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1a1a5e] mb-6">{product.name}</h1>
              <div className="text-2xl font-bold text-[#1a1a5e] mb-6">{product.price}</div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Poids</span>
                  <span className="block font-bold text-[#1a1a5e]">{product.specs.weight}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Puissance</span>
                  <span className="block font-bold text-[#1a1a5e]">{product.specs.power}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Profondeur Max</span>
                  <span className="block font-bold text-[#1a1a5e]">{product.specs.depth}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Moteur</span>
                  <span className="block font-bold text-[#1a1a5e]">{product.specs.engine}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  onClick={handleAddToCart}
                  className="btn-rippa h-14 px-8 text-base flex-1"
                >
                  AJOUTER AU DEVIS
                </Button>
                {product.pdf && (
                  <a href={product.pdf} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full h-14 px-8 border-[#1a1a5e] text-[#1a1a5e] hover:bg-[#1a1a5e] hover:text-white rounded-none uppercase font-bold tracking-wider">
                      <FileText className="mr-2 h-4 w-4" /> FICHE TECHNIQUE
                    </Button>
                  </a>
                )}
              </div>
              
              <div className="border-t border-gray-100 pt-8">
                <h3 className="font-serif font-bold text-[#1a1a5e] mb-4">Points Forts</h3>
                <ul className="space-y-2">
                  {product.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Specs */}
          {productSpecs && (
            <div className="mt-16">
              <h2 className="text-3xl font-serif font-bold text-[#1a1a5e] mb-8 pb-4 border-b border-gray-200">Spécifications Techniques</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                {Object.entries(productSpecs).map(([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold text-[#1a1a5e] mb-6 bg-gray-50 p-3 border-l-4 border-[#1a1a5e]">{category}</h3>
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
          <div className="mt-20 bg-[#1a1a5e] rounded-lg p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Besoin d'un financement ?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Nous proposons des solutions de financement adaptées aux professionnels. Contactez nos experts pour obtenir une simulation personnalisée.
            </p>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-[#1a1a5e] h-12 px-8">
              Contacter un conseiller
            </Button>
          </div>

        </div>
      </main>
      
      <Footer />
    </div>
  );
}
