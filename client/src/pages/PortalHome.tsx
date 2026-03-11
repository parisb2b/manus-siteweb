import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Sun, Tractor, Home as HomeIcon, Hammer } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageContent } from "@/hooks/useSiteContent";

const defaultTrustItems = [
  { title: "Expertise DOM TOM", description: "Livraison maîtrisée vers la Guadeloupe, Martinique, Guyane, Réunion et Mayotte." },
  { title: "Qualité Certifiée", description: "Des produits rigoureusement sélectionnés pour leur robustesse et leur durabilité." },
  { title: "SAV Réactif", description: "Assistance technique disponible 24/7 via WhatsApp pour vous accompagner." },
];

const trustIcons = [
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
];

export default function PortalHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { page } = usePageContent("home");

  const categories = [
    {
      id: "rippa",
      title: "Mini-pelles",
      description: "Gamme complète de mini-pelles performantes pour vos chantiers.",
      image: "/images/products/r32_pro/r32_pro_main_view.png",
      link: "/minipelles",
      icon: Hammer,
      iconColor: "text-blue-600",
      borderColor: "border-blue-600"
    },
    {
      id: "modular",
      title: "Maisons Modulaires",
      description: "Maisons modulaires, studios et camping-cars tout confort.",
      image: "/images/portal/modular_home.png",
      link: "/maisons",
      icon: HomeIcon,
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-600"
    },
    {
      id: "solar",
      title: "Panneaux Solaires",
      description: "Solutions photovoltaïques pour l'autonomie énergétique.",
      image: "/images/portal/solar_panel_jinko.png",
      link: "/solaire",
      icon: Sun,
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-500"
    },
    {
      id: "agri",
      title: "Machines Agricoles",
      description: "Tracteurs, compacteurs et équipements professionnels.",
      image: "/images/portal/agri_tractor.jpg",
      link: "/agricole",
      icon: Tractor,
      iconColor: "text-orange-600",
      borderColor: "border-orange-600"
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();

    // Intelligent redirection logic
    if (query.includes("pelle") || query.includes("rippa") || query.includes("r22") || query.includes("r32")) {
      setLocation("/minipelles");
    } else if (query.includes("maison") || query.includes("cabin") || query.includes("camping")) {
      setLocation("/maisons");
    } else if (query.includes("solaire") || query.includes("panneau") || query.includes("energie")) {
      setLocation("/solaire");
    } else if (query.includes("tracteur") || query.includes("agri") || query.includes("ferme")) {
      setLocation("/agricole");
    } else {
      // Default fallback search (could be improved with a dedicated search page)
      setLocation("/minipelles");
    }
  };

  const trustItems = page?.trustItems || defaultTrustItems;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Compact Hero Section */}
        <div className="relative pt-24 pb-40 px-4 sm:px-6 lg:px-8 text-center text-white overflow-hidden">
          {/* Background Image with Dark Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/portal/hero_ship.png"
              alt="Logistique 97 import"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight text-white">
              {page?.heroTitle || "97 import"}
            </h1>

            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto font-light">
              {page?.heroSubtitle || "Avec 97 import, l'importation n'a jamais été aussi simple depuis la Chine vers les Antilles."}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative transform hover:scale-105 transition-transform duration-300">
              <div className="relative flex items-center bg-white rounded-full shadow-2xl p-1.5">
                <Search className="absolute left-5 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Que recherchez-vous ?"
                  className="w-full pl-12 pr-4 py-3 rounded-full text-gray-900 text-base focus:outline-none placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-[#4A90D9] hover:bg-[#3A7BC8] text-white px-6 py-3 rounded-full font-bold transition-all shadow-md text-sm uppercase tracking-wide"
                >
                  {page?.heroButtonText || "Rechercher"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Categories Grid - Overlapping the Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Link key={category.id} href={category.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full flex flex-col"
                >
                  {/* Image Section */}
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>

                  {/* Content Section with Overlapping Icon */}
                  <div className="relative px-6 pt-12 pb-8 flex-grow flex flex-col">
                    {/* Overlapping Icon */}
                    <div className={`absolute -top-10 left-6 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-4 ${category.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                      <category.icon className={`w-8 h-8 ${category.iconColor}`} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#4A90D9] transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-grow">
                      {category.description}
                    </p>
                    <span className={`text-sm font-bold uppercase tracking-wider ${category.iconColor} group-hover:underline decoration-2 underline-offset-4`}>
                      Découvrir
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold text-[#4A90D9] mb-12">{page?.trustTitle || "Pourquoi choisir 97 import ?"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trustItems.map((item: { title: string; description: string }, index: number) => (
                <div key={index} className="p-6 rounded-2xl bg-gray-50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-[#4A90D9] shadow-md">
                    {trustIcons[index] || trustIcons[0]}
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-[#4A90D9]">{item.title}</h4>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
