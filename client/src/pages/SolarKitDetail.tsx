import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
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
import { usePageContent } from "@/hooks/useSiteContent";

// ════════════════════════════════════════════════════
// DONNÉES DES KITS SOLAIRES
// ════════════════════════════════════════════════════

const SOLAR_KITS: Record<string, any> = {
  "kit-10kw": {
    id: "kit-solaire-10kw",
    slug: "kit-10kw",
    name: "Kit Solaire 10 kW",
    subtitle: "10 kVA — 17 panneaux JinkoSolar Tiger Neo 600W",
    price: "7 912,00 EUR HT",
    priceNum: 7912,
    description:
      "Kit solaire complet de 10,2 kWc conçu pour l'autonomie énergétique en zone tropicale. Équipé de 17 panneaux JinkoSolar Tiger Neo 600W bifacial N-type TOPcon de dernière génération, d'un onduleur hybride 10 kVA et d'une batterie LiFePO4 10 kWh. Installation complète prête à poser, adaptée aux DOM-TOM.",
    panels: 17,
    totalPower: "10,2 kWc",
    production: "13 000 - 16 000 kWh/an",
    surface: "~42 m²",
    totalWeight: "~641 kg (17 × 37,7 kg)",
    inverter: "Hybride 10 kVA, rendement > 97%",
    battery: "LiFePO4 10 kWh, 6000+ cycles, garantie 10 ans",
    batteryCapacity: "10 kWh",
    connectors: 34,
    contenu: [
      "17 panneaux solaires JinkoSolar Tiger Neo 600W bifacial N-type",
      "1 onduleur hybride 10 kVA (compatible réseau + batterie)",
      "1 batterie lithium LiFePO4 10 kWh",
      "1 coffret de protection AC/DC avec parafoudre",
      "Câblage solaire 6mm² (longueur adaptée)",
      "34 connecteurs MC4 (paires mâle/femelle)",
      "Kit de fixation toiture (rails aluminium + crochets + boulons inox)",
      "Mise à la terre + câble de terre",
      "Documentation technique et guide d'installation",
    ],
    specs: {
      "Caractéristiques système": [
        { label: "Puissance totale", value: "10,2 kWc" },
        { label: "Nombre de panneaux", value: "17 × 600W" },
        {
          label: "Production estimée",
          value: "13 000 - 16 000 kWh/an (zone tropicale DOM-TOM)",
        },
        {
          label: "Technologie panneaux",
          value: "N-type TOPcon bifacial double verre",
        },
        { label: "Onduleur", value: "Hybride 10 kVA, rendement > 97%" },
        {
          label: "Batterie",
          value: "LiFePO4 10 kWh, 6000+ cycles, garantie 10 ans",
        },
        { label: "Tension système", value: "48V DC" },
        { label: "Surface nécessaire", value: "~42 m² de toiture" },
        { label: "Poids total panneaux", value: "~641 kg (17 × 37,7 kg)" },
      ],
      "Panneau JinkoSolar Tiger Neo": [
        { label: "Modèle", value: "JKM575-600N-72HL4-BDX-F4 (version EU)" },
        { label: "Puissance unitaire", value: "600W" },
        { label: "Technologie", value: "N-type TOPcon, bifacial, double verre" },
        { label: "Dimensions panneau", value: "2278 × 1134 × 30 mm" },
        { label: "Poids panneau", value: "37,7 kg" },
        { label: "Efficacité maximale", value: "23,23%" },
        { label: "Dégradation 1ère année", value: "1%" },
        { label: "Dégradation annuelle", value: "0,40%" },
        { label: "Tension max système", value: "1500 VDC" },
      ],
      "Résistance & Certifications": [
        { label: "Résistance grêle", value: "45 mm" },
        {
          label: "Charge mécanique",
          value: "6000 Pa avant / 4000 Pa arrière",
        },
        { label: "Classe feu", value: "Classe A" },
        {
          label: "Certifications",
          value: "IEC61215:2021, IEC61730:2023, IEC61701, IEC62716",
        },
        { label: "Normes ISO", value: "ISO9001, ISO14001, ISO45001" },
        { label: "Conformité", value: "CE, IEC, normes européennes" },
      ],
      Garanties: [
        { label: "Garantie produit panneaux", value: "25 ans" },
        {
          label: "Garantie performance",
          value: "30 ans linéaire (87,4% après 30 ans)",
        },
        { label: "Garantie onduleur", value: "10 ans" },
        { label: "Garantie batterie", value: "10 ans" },
      ],
    },
  },
  "kit-12kw": {
    id: "kit-solaire-12kw",
    slug: "kit-12kw",
    name: "Kit Solaire 12 kW",
    subtitle: "12 kVA — 20 panneaux JinkoSolar Tiger Neo 600W",
    price: "9 500,00 EUR HT",
    priceNum: 9500,
    description:
      "Kit solaire complet de 12 kWc pour les habitations à forte consommation. Équipé de 20 panneaux JinkoSolar Tiger Neo 600W bifacial N-type TOPcon, d'un onduleur hybride 12 kVA et d'une batterie LiFePO4 15 kWh. Solution complète clé en main, idéale pour les DOM-TOM.",
    panels: 20,
    totalPower: "12 kWc",
    production: "15 600 - 19 200 kWh/an",
    surface: "~50 m²",
    totalWeight: "~754 kg (20 × 37,7 kg)",
    inverter: "Hybride 12 kVA, rendement > 97%",
    battery: "LiFePO4 15 kWh, 6000+ cycles, garantie 10 ans",
    batteryCapacity: "15 kWh",
    connectors: 40,
    contenu: [
      "20 panneaux solaires JinkoSolar Tiger Neo 600W bifacial N-type",
      "1 onduleur hybride 12 kVA (compatible réseau + batterie)",
      "1 batterie lithium LiFePO4 15 kWh",
      "1 coffret de protection AC/DC avec parafoudre",
      "Câblage solaire 6mm² (longueur adaptée)",
      "40 connecteurs MC4 (paires mâle/femelle)",
      "Kit de fixation toiture (rails aluminium + crochets + boulons inox)",
      "Mise à la terre + câble de terre",
      "Documentation technique et guide d'installation",
    ],
    specs: {
      "Caractéristiques système": [
        { label: "Puissance totale", value: "12 kWc" },
        { label: "Nombre de panneaux", value: "20 × 600W" },
        {
          label: "Production estimée",
          value: "15 600 - 19 200 kWh/an (zone tropicale DOM-TOM)",
        },
        {
          label: "Technologie panneaux",
          value: "N-type TOPcon bifacial double verre",
        },
        { label: "Onduleur", value: "Hybride 12 kVA, rendement > 97%" },
        {
          label: "Batterie",
          value: "LiFePO4 15 kWh, 6000+ cycles, garantie 10 ans",
        },
        { label: "Tension système", value: "48V DC" },
        { label: "Surface nécessaire", value: "~50 m² de toiture" },
        { label: "Poids total panneaux", value: "~754 kg (20 × 37,7 kg)" },
      ],
      "Panneau JinkoSolar Tiger Neo": [
        { label: "Modèle", value: "JKM575-600N-72HL4-BDX-F4 (version EU)" },
        { label: "Puissance unitaire", value: "600W" },
        { label: "Technologie", value: "N-type TOPcon, bifacial, double verre" },
        { label: "Dimensions panneau", value: "2278 × 1134 × 30 mm" },
        { label: "Poids panneau", value: "37,7 kg" },
        { label: "Efficacité maximale", value: "23,23%" },
        { label: "Dégradation 1ère année", value: "1%" },
        { label: "Dégradation annuelle", value: "0,40%" },
        { label: "Tension max système", value: "1500 VDC" },
      ],
      "Résistance & Certifications": [
        { label: "Résistance grêle", value: "45 mm" },
        {
          label: "Charge mécanique",
          value: "6000 Pa avant / 4000 Pa arrière",
        },
        { label: "Classe feu", value: "Classe A" },
        {
          label: "Certifications",
          value: "IEC61215:2021, IEC61730:2023, IEC61701, IEC62716",
        },
        { label: "Normes ISO", value: "ISO9001, ISO14001, ISO45001" },
        { label: "Conformité", value: "CE, IEC, normes européennes" },
      ],
      Garanties: [
        { label: "Garantie produit panneaux", value: "25 ans" },
        {
          label: "Garantie performance",
          value: "30 ans linéaire (87,4% après 30 ans)",
        },
        { label: "Garantie onduleur", value: "10 ans" },
        { label: "Garantie batterie", value: "10 ans" },
      ],
    },
  },
  "kit-20kw": {
    id: "kit-solaire-20kw",
    slug: "kit-20kw",
    name: "Kit Solaire 20 kW",
    subtitle: "20 kVA — 34 panneaux JinkoSolar Tiger Neo 600W",
    price: "15 800,00 EUR HT",
    priceNum: 15800,
    description:
      "Kit solaire professionnel de 20,4 kWc pour les grandes installations. Équipé de 34 panneaux JinkoSolar Tiger Neo 600W bifacial N-type TOPcon, d'un onduleur hybride 20 kVA et de 2 batteries LiFePO4 15 kWh (30 kWh total). La solution la plus puissante pour l'autonomie complète en zone tropicale DOM-TOM.",
    panels: 34,
    totalPower: "20,4 kWc",
    production: "26 000 - 32 000 kWh/an",
    surface: "~85 m²",
    totalWeight: "~1 282 kg (34 × 37,7 kg)",
    inverter: "Hybride 20 kVA, rendement > 97%",
    battery:
      "2× LiFePO4 15 kWh = 30 kWh total, 6000+ cycles, garantie 10 ans",
    batteryCapacity: "30 kWh (2 × 15 kWh)",
    connectors: 68,
    contenu: [
      "34 panneaux solaires JinkoSolar Tiger Neo 600W bifacial N-type",
      "1 onduleur hybride 20 kVA (compatible réseau + batterie)",
      "2 batteries lithium LiFePO4 15 kWh (30 kWh total)",
      "1 coffret de protection AC/DC avec parafoudre",
      "Câblage solaire 6mm² (longueur adaptée)",
      "68 connecteurs MC4 (paires mâle/femelle)",
      "Kit de fixation toiture (rails aluminium + crochets + boulons inox)",
      "Mise à la terre + câble de terre",
      "Documentation technique et guide d'installation",
    ],
    specs: {
      "Caractéristiques système": [
        { label: "Puissance totale", value: "20,4 kWc" },
        { label: "Nombre de panneaux", value: "34 × 600W" },
        {
          label: "Production estimée",
          value: "26 000 - 32 000 kWh/an (zone tropicale DOM-TOM)",
        },
        {
          label: "Technologie panneaux",
          value: "N-type TOPcon bifacial double verre",
        },
        { label: "Onduleur", value: "Hybride 20 kVA, rendement > 97%" },
        {
          label: "Batterie",
          value: "2× LiFePO4 15 kWh = 30 kWh total, 6000+ cycles",
        },
        { label: "Tension système", value: "48V DC" },
        { label: "Surface nécessaire", value: "~85 m² de toiture" },
        {
          label: "Poids total panneaux",
          value: "~1 282 kg (34 × 37,7 kg)",
        },
      ],
      "Panneau JinkoSolar Tiger Neo": [
        { label: "Modèle", value: "JKM575-600N-72HL4-BDX-F4 (version EU)" },
        { label: "Puissance unitaire", value: "600W" },
        { label: "Technologie", value: "N-type TOPcon, bifacial, double verre" },
        { label: "Dimensions panneau", value: "2278 × 1134 × 30 mm" },
        { label: "Poids panneau", value: "37,7 kg" },
        { label: "Efficacité maximale", value: "23,23%" },
        { label: "Dégradation 1ère année", value: "1%" },
        { label: "Dégradation annuelle", value: "0,40%" },
        { label: "Tension max système", value: "1500 VDC" },
      ],
      "Résistance & Certifications": [
        { label: "Résistance grêle", value: "45 mm" },
        {
          label: "Charge mécanique",
          value: "6000 Pa avant / 4000 Pa arrière",
        },
        { label: "Classe feu", value: "Classe A" },
        {
          label: "Certifications",
          value: "IEC61215:2021, IEC61730:2023, IEC61701, IEC62716",
        },
        { label: "Normes ISO", value: "ISO9001, ISO14001, ISO45001" },
        { label: "Conformité", value: "CE, IEC, normes européennes" },
      ],
      Garanties: [
        { label: "Garantie produit panneaux", value: "25 ans" },
        {
          label: "Garantie performance",
          value: "30 ans linéaire (87,4% après 30 ans)",
        },
        { label: "Garantie onduleur", value: "10 ans" },
        { label: "Garantie batterie", value: "10 ans" },
      ],
    },
  },
};

const DEFAULT_GALLERY = ["/images/solar/kit_overview.webp"];

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
  const { page } = usePageContent("solaire");
  const GALLERY_IMAGES = (page?.galleryImages as string[] | undefined)?.length ? (page.galleryImages as string[]) : DEFAULT_GALLERY;

  // Auto-play carousel every 5 seconds
  const goNext = useCallback(() => {
    setActiveImage((prev) => (prev >= GALLERY_IMAGES.length - 1 ? 0 : prev + 1));
  }, [GALLERY_IMAGES.length]);

  useEffect(() => {
    if (GALLERY_IMAGES.length <= 1) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext, GALLERY_IMAGES.length, activeImage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (GALLERY_IMAGES.length <= 1) return;
      if (e.key === "ArrowLeft") setActiveImage((p) => (p === 0 ? GALLERY_IMAGES.length - 1 : p - 1));
      if (e.key === "ArrowRight") setActiveImage((p) => (p >= GALLERY_IMAGES.length - 1 ? 0 : p + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [GALLERY_IMAGES.length]);

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
      image: GALLERY_IMAGES[0],
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
            {/* Image Carousel */}
            <div className="space-y-4">
              {/* Main image with nav arrows */}
              <div className="relative bg-gray-50 rounded-xl border border-gray-100 overflow-hidden group">
                <div className="aspect-[4/3] flex items-center justify-center p-6">
                  <img
                    src={GALLERY_IMAGES[activeImage]}
                    alt={`${kit.name} vue ${activeImage + 1}`}
                    className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                  />
                </div>

                {GALLERY_IMAGES.length > 1 && (
                  <>
                    {/* Left arrow */}
                    <button
                      onClick={() => setActiveImage((prev) => (prev === 0 ? GALLERY_IMAGES.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    {/* Right arrow */}
                    <button
                      onClick={() => setActiveImage((prev) => (prev === GALLERY_IMAGES.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                    {/* Counter badge */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                      {activeImage + 1} / {GALLERY_IMAGES.length}
                    </div>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {GALLERY_IMAGES.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImage(index)}
                          className={`rounded-full transition-all ${
                            activeImage === index
                              ? "w-6 h-2 bg-[#4A90D9]"
                              : "w-2 h-2 bg-white/70 hover:bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {GALLERY_IMAGES.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {GALLERY_IMAGES.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg border-2 overflow-hidden transition-all ${
                        activeImage === index
                          ? "border-[#4A90D9] ring-1 ring-[#4A90D9]/30"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${kit.name} miniature ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <span className="text-[#4A90D9] font-bold tracking-widest uppercase text-sm mb-2 block">
                Kit Solaire JinkoSolar
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#4A90D9] mb-3">
                {kit.name}
              </h1>
              <p className="text-gray-500 text-sm mb-6">{kit.subtitle}</p>
              <div className="text-2xl font-bold text-[#4A90D9] mb-2">
                {kit.price}
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Livraison non incluse — Hors frais de port
              </p>

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
                    {kit.panels} × 600W
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Batterie
                  </span>
                  <span className="block font-bold text-[#4A90D9]">
                    {kit.batteryCapacity}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded border border-gray-100">
                  <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Production/an
                  </span>
                  <span className="block font-bold text-[#4A90D9] text-sm">
                    {kit.production}
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
                    "Résistant aux conditions tropicales (grêle 45mm, sel, ammoniac)",
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
              {Object.entries(kit.specs).map(
                ([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold text-[#4A90D9] mb-6 bg-gray-50 p-3 border-l-4 border-[#4A90D9]">
                      {category}
                    </h3>
                    <div className="space-y-4">
                      {items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className={`flex justify-between border-b border-gray-100 pb-2 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          } px-2 py-1 rounded`}
                        >
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium text-gray-900 text-right ml-4">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* GARANTIES                               */}
          {/* ═══════════════════════════════════════ */}
          <div className="mb-20">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-8 pb-4 border-b border-gray-200 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8" />
              Garanties
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#4A90D9]/5 to-[#4A90D9]/10 border border-[#4A90D9]/20 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">
                  25
                </div>
                <div className="text-sm font-bold text-[#4A90D9] uppercase tracking-wider mb-2">
                  ans
                </div>
                <p className="text-gray-600 text-sm">Garantie produit panneaux</p>
              </div>
              <div className="bg-gradient-to-br from-[#4A90D9]/5 to-[#4A90D9]/10 border border-[#4A90D9]/20 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">
                  30
                </div>
                <div className="text-sm font-bold text-[#4A90D9] uppercase tracking-wider mb-2">
                  ans
                </div>
                <p className="text-gray-600 text-sm">
                  Performance linéaire (87,4%)
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#4A90D9]/5 to-[#4A90D9]/10 border border-[#4A90D9]/20 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">
                  10
                </div>
                <div className="text-sm font-bold text-[#4A90D9] uppercase tracking-wider mb-2">
                  ans
                </div>
                <p className="text-gray-600 text-sm">Garantie onduleur</p>
              </div>
              <div className="bg-gradient-to-br from-[#4A90D9]/5 to-[#4A90D9]/10 border border-[#4A90D9]/20 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">
                  10
                </div>
                <div className="text-sm font-bold text-[#4A90D9] uppercase tracking-wider mb-2">
                  ans
                </div>
                <p className="text-gray-600 text-sm">Garantie batterie</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════ */}
          {/* CERTIFICATIONS                          */}
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
                    Les cellules TOPcon offrent un rendement supérieur de 23,23%
                    pour une production maximale d'énergie.
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
                    gain de production jusqu'à 30%.
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
                    Résistance grêle 45mm, charge mécanique 6000 Pa, certifié
                    sel et ammoniac. Conçu pour les DOM-TOM.
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
                    Panneaux, onduleur, batterie, câblage, fixations — tout est
                    inclus pour une mise en service rapide.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financing Banner */}
          <div className="mt-20 bg-[#4A90D9] rounded-lg p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 text-white">
              Besoin d'un financement ?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
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
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#4A90D9] h-12 px-8"
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
