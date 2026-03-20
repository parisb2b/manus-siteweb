import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Award,
  Sun,
  Zap,
  Battery,
  Package,
  Settings,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { showCartNotification } from "@/components/CartNotification";
import PrixOuDevis from "@/components/PrixOuDevis";

// ════════════════════════════════════════════════════
// DONNÉES DES KITS SOLAIRES
// ════════════════════════════════════════════════════

const SOLAR_KITS: Record<string, any> = {
  "kit-10kw": {
    id: "kit-solaire-10kw",
    slug: "kit-10kw",
    name: "Kit Solaire 10 kW",
    subtitle: "Monophasé — 16 panneaux Jinko Solar 585W",
    price: "7 990,00 EUR HT",
    priceNum: 7990,
    type: "Monophasé",
    description:
      "Kit solaire complet de 10 kW monophasé. Équipé de 16 panneaux Jinko Solar 585W N-type TOPcon bifacial double verre et d'un onduleur hybride DEYE 10 kW. Installation complète prête à poser.",
    panels: 16,
    totalPower: "10 kW",
    inverterName: "DEYE 1 Phase Low Voltage Hybrid 10KW Inverter",
    inverterModel: "SUN-10K-SG02LP1-EU-AM3-P",
    contenu: [
      "16 panneaux solaires Jinko Solar 585W bifacial N-type",
      "1 onduleur hybride DEYE 10 kW monophasé (SUN-10K-SG02LP1-EU-AM3-P)",
      "Kit de fixation toiture (rails aluminium + crochets + boulons inox)",
      "Câblage solaire",
      "Connecteurs MC4",
      "Documentation technique et guide d'installation",
    ],
    specs: [
      { label: "Puissance système", value: "10 kW" },
      { label: "Type", value: "Monophasé" },
      { label: "Nombre de panneaux", value: "16" },
      { label: "Marque panneaux", value: "Jinko Solar" },
      { label: "Modèle panneaux", value: "72HL4-BDV" },
      { label: "Puissance par panneau", value: "585 W" },
      { label: "Dimensions panneau", value: "2278 × 1134 × 30 mm" },
      { label: "Technologie panneaux", value: "N-type TOPcon, bifacial, double verre" },
      { label: "Onduleur", value: "DEYE 1 Phase Low Voltage Hybrid 10KW Inverter" },
      { label: "Modèle onduleur", value: "SUN-10K-SG02LP1-EU-AM3-P" },
      { label: "Garantie", value: "20 ans" },
    ],
    prixAchat: 6146,
  },
  "kit-12kw": {
    id: "kit-solaire-12kw",
    slug: "kit-12kw",
    name: "Kit Solaire 12 kW",
    subtitle: "Monophasé — 20 panneaux Jinko Solar 585W",
    price: "8 990,00 EUR HT",
    priceNum: 8990,
    type: "Monophasé",
    description:
      "Kit solaire complet de 12 kW monophasé. Équipé de 20 panneaux Jinko Solar 585W N-type TOPcon bifacial double verre et d'un onduleur hybride DEYE 12 kW. Solution complète clé en main.",
    panels: 20,
    totalPower: "12 kW",
    inverterName: "DEYE 1 Phase Low Voltage Hybrid 12KW Inverter",
    inverterModel: "SUN-12K-SG02LP1-EU-AM3",
    contenu: [
      "20 panneaux solaires Jinko Solar 585W bifacial N-type",
      "1 onduleur hybride DEYE 12 kW monophasé (SUN-12K-SG02LP1-EU-AM3)",
      "Kit de fixation toiture (rails aluminium + crochets + boulons inox)",
      "Câblage solaire",
      "Connecteurs MC4",
      "Documentation technique et guide d'installation",
    ],
    specs: [
      { label: "Puissance système", value: "12 kW" },
      { label: "Type", value: "Monophasé" },
      { label: "Nombre de panneaux", value: "20" },
      { label: "Marque panneaux", value: "Jinko Solar" },
      { label: "Modèle panneaux", value: "72HL4-BDV" },
      { label: "Puissance par panneau", value: "585 W" },
      { label: "Dimensions panneau", value: "2278 × 1134 × 30 mm" },
      { label: "Technologie panneaux", value: "N-type TOPcon, bifacial, double verre" },
      { label: "Onduleur", value: "DEYE 1 Phase Low Voltage Hybrid 12KW Inverter" },
      { label: "Modèle onduleur", value: "SUN-12K-SG02LP1-EU-AM3" },
      { label: "Garantie", value: "20 ans" },
    ],
    prixAchat: 6915,
  },
  "kit-20kw": {
    id: "kit-solaire-20kw",
    slug: "kit-20kw",
    name: "Kit Solaire 20 kW",
    subtitle: "Triphasé — 33 panneaux Jinko Solar 585W",
    price: "18 990,00 EUR HT",
    priceNum: 18990,
    type: "Triphasé",
    description:
      "Kit solaire professionnel de 20 kW triphasé pour les grandes installations. Équipé de 33 panneaux Jinko Solar 585W N-type TOPcon bifacial double verre et d'un onduleur hybride DEYE 20 kW triphasé. La solution la plus puissante de notre gamme.",
    panels: 33,
    totalPower: "20 kW",
    inverterName: "DEYE 3 Phase Low Voltage Hybrid 20KW Inverter",
    inverterModel: "SUN-20K-SG05LP3-EU-SM2",
    contenu: [
      "33 panneaux solaires Jinko Solar 585W bifacial N-type",
      "1 onduleur hybride DEYE 20 kW triphasé (SUN-20K-SG05LP3-EU-SM2)",
      "Kit de fixation toiture (rails aluminium + crochets + boulons inox)",
      "Câblage solaire",
      "Connecteurs MC4",
      "Documentation technique et guide d'installation",
    ],
    specs: [
      { label: "Puissance système", value: "20 kW" },
      { label: "Type", value: "Triphasé" },
      { label: "Nombre de panneaux", value: "33" },
      { label: "Marque panneaux", value: "Jinko Solar" },
      { label: "Modèle panneaux", value: "72HL4-BDV" },
      { label: "Puissance par panneau", value: "585 W" },
      { label: "Dimensions panneau", value: "2278 × 1134 × 30 mm" },
      { label: "Technologie panneaux", value: "N-type TOPcon, bifacial, double verre" },
      { label: "Onduleur", value: "DEYE 3 Phase Low Voltage Hybrid 20KW Inverter" },
      { label: "Modèle onduleur", value: "SUN-20K-SG05LP3-EU-SM2" },
      { label: "Garantie", value: "20 ans" },
    ],
    prixAchat: 14608,
  },
};

const GALLERY_IMAGES = [
  "/images/products/solar_kits/tiger_neo_585w.avif",
  "/images/products/solar_kits/jinko_tiger_neo_fiche.webp",
  "/images/products/solar_kits/jinko_panels_pair.webp",
  "/images/products/solar_kits/jinko_panel_layers.png",
  "/images/products/solar_kits/deye_inverter.png",
  "/images/products/solar_kits/battery_lifepo4.png",
  "/images/products/solar_kits/solar_cables.png",
  "/images/products/solar_kits/jinko_installation_toiture.webp",
  "/images/products/solar_kits/jinko_warehouse_stock.webp",
];

// ════════════════════════════════════════════════════
// COMPOSANT PAGE
// ════════════════════════════════════════════════════

export default function SolarKitDetail() {
  const [match, params] = useRoute("/solaire/:slug");
  const [, setLocation] = useLocation();
  const slug = match && params ? params.slug : null;
  const kit = slug ? SOLAR_KITS[slug] : null;
  const { addToCart } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  const goToPrev = () => {
    setActiveImage((prev) => (prev === 0 ? GALLERY_IMAGES.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveImage((prev) => (prev === GALLERY_IMAGES.length - 1 ? 0 : prev + 1));
  };

  if (!kit) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-serif font-bold text-[#4A90D9] mb-4">
              Produit non trouvé
            </h1>
            <Button
              onClick={() => setLocation("/solaire")}
              className="btn-rippa"
            >
              Retour au catalogue solaire
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    addToCart({
      id: kit.id,
      name: kit.name,
      price: kit.price,
      image: "/images/products/solar_kits/tiger_neo_585w.avif",
      type: "solar",
    });
    showCartNotification(kit.name);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <Header />

      <main className="flex-grow pt-8 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <a href="/" className="hover:text-[#4A90D9]">
              Accueil
            </a>
            <span className="mx-2">/</span>
            <a href="/solaire" className="hover:text-[#4A90D9]">
              Solaire
            </a>
            <span className="mx-2">/</span>
            <span className="text-[#4A90D9] font-medium">{kit.name}</span>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* EN-TÊTE PRODUIT : Image + Info           */}
          {/* ═══════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Image Gallery — CARROUSEL MANUEL (flèches + points) */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-8 aspect-[4/3] flex items-center justify-center border border-gray-100 relative overflow-hidden group">
                <img
                  src={GALLERY_IMAGES[activeImage]}
                  alt={`${kit.name} vue ${activeImage + 1}`}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                {/* Flèche gauche */}
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="h-5 w-5 text-[#4A90D9]" />
                </button>
                {/* Flèche droite */}
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full p-2 shadow-md transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="h-5 w-5 text-[#4A90D9]" />
                </button>
                {/* Points indicateurs */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {GALLERY_IMAGES.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeImage === index
                          ? "bg-[#4A90D9] scale-110"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              {/* Miniatures */}
              {GALLERY_IMAGES.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {GALLERY_IMAGES.slice(0, 8).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`bg-gray-50 rounded-lg p-2 aspect-square border transition-all ${
                        activeImage === index
                          ? "border-[#4A90D9] ring-1 ring-[#4A90D9]"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${kit.name} miniature ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <span className="text-[#4A90D9] font-bold tracking-widest uppercase text-sm mb-2 block">
                Kit Solaire Jinko Solar + DEYE
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4A90D9] mb-3">
                {kit.name}
              </h1>
              <p className="text-gray-500 text-sm mb-6">{kit.subtitle}</p>
              <div className="mb-6">
                <PrixOuDevis prixAchat={kit.prixAchat} />
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">
                {kit.description}
              </p>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Puissance
                  </span>
                  <span className="block font-bold text-[#4A90D9]">
                    {kit.totalPower}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Panneaux
                  </span>
                  <span className="block font-bold text-[#4A90D9]">
                    {kit.panels} × 585W
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Type
                  </span>
                  <span className="block font-bold text-[#4A90D9]">
                    {kit.type}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Garantie
                  </span>
                  <span className="block font-bold text-[#4A90D9]">
                    20 ans
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={handleAddToCart}
                  className="btn-rippa h-14 px-8 text-base flex-1"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  AJOUTER AU PANIER
                </Button>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="font-serif font-bold text-[#4A90D9] mb-4">
                  Points Forts
                </h3>
                <ul className="space-y-2">
                  {[
                    "Technologie N-type dernière génération",
                    "Bifacial : produit aussi par l'arrière",
                    "Résistant aux conditions tropicales",
                    "Installation complète prête à poser",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* CONTENU DU KIT                          */}
          {/* ═══════════════════════════════════════ */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200 flex items-center gap-3">
              <Package className="h-8 w-8" />
              Contenu du Kit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kit.contenu.map((item: string, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#4A90D9] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* FICHE TECHNIQUE                         */}
          {/* ═══════════════════════════════════════ */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200 flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Fiche Technique
            </h2>

            <div className="max-w-2xl">
              <div className="space-y-0">
                {kit.specs.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center px-4 py-3 ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } border-b border-gray-100`}
                  >
                    <span className="text-gray-600 font-medium">{item.label}</span>
                    <span className="font-bold text-gray-900 text-right ml-4">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* GARANTIE                                */}
          {/* ═══════════════════════════════════════ */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8" />
              Garantie
            </h2>
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-[#4A90D9]/5 to-[#4A90D9]/10 border border-[#4A90D9]/20 rounded-xl p-8 text-center max-w-sm">
                <div className="text-5xl font-bold text-[#4A90D9] mb-2">
                  20
                </div>
                <div className="text-lg font-bold text-[#4A90D9] uppercase tracking-wider mb-3">
                  ans
                </div>
                <p className="text-gray-600 text-sm">
                  Garantie pour l'ensemble du kit
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* CERTIFICATIONS (conservées telles quelles) */}
          {/* ═══════════════════════════════════════ */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200 flex items-center gap-3">
              <Award className="h-8 w-8" />
              Certifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                "IEC61215:2021",
                "IEC61730:2023",
                "IEC61701",
                "IEC62716",
                "ISO9001",
                "ISO14001",
                "ISO45001",
                "CE",
                "Classe A",
              ].map((cert, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
                >
                  <span className="text-sm font-bold text-gray-700">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm mt-4 text-center">
              Conforme aux normes européennes — Adapté aux DOM-TOM
            </p>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* POURQUOI CHOISIR CE KIT                 */}
          {/* ═══════════════════════════════════════ */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200">
              Pourquoi choisir ce kit ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Sun className="h-10 w-10 text-[#4A90D9] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    Technologie N-type dernière génération
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Les cellules TOPcon offrent un rendement supérieur pour une
                    production maximale d'énergie.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Zap className="h-10 w-10 text-[#4A90D9] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    Bifacial : produit aussi par l'arrière
                  </h4>
                  <p className="text-gray-600 text-sm">
                    La technologie bifaciale capte la lumière réfléchie pour un
                    gain de production supplémentaire.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <ShieldCheck className="h-10 w-10 text-[#4A90D9] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    Résistant aux conditions tropicales
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Panneaux double verre conçus pour résister aux environnements
                    exigeants des DOM-TOM.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <Battery className="h-10 w-10 text-[#4A90D9] flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    Installation complète prête à poser
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Panneaux, onduleur, câblage, fixations — tout est inclus
                    pour une mise en service rapide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financing Banner — bloc bien visible */}
          <div className="mt-20 bg-gradient-to-br from-[#4A90D9] to-[#3570b8] rounded-2xl p-10 md:p-14 text-white text-center shadow-2xl shadow-blue-900/30 border border-blue-400/30">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-white">
              Besoin d'un financement ?
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Nous proposons des solutions de financement adaptées aux
              professionnels et aux particuliers. Contactez nos experts pour
              obtenir une simulation personnalisée.
            </p>
            <a
              href="https://wa.me/33663284908"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="bg-white text-[#4A90D9] border-white hover:bg-white/90 hover:text-[#3570b8] h-14 px-10 text-lg font-bold shadow-lg"
              >
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
