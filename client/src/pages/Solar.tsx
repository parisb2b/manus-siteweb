import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Sun, Battery, Zap, ShieldCheck } from "lucide-react";

export default function Solar() {
  const products = [
    {
      id: "kit-solaire-10kw",
      name: "Kit Solaire 10 kW",
      price: "7 912 € HT",
      image: "/images/portal/solar_panel_jinko.png",
      link: "/solaire/kit-10kw",
    },
    {
      id: "kit-solaire-12kw",
      name: "Kit Solaire 12 kW",
      price: "9 500 € HT",
      image: "/images/portal/solar_panel_jinko.png",
      link: "/solaire/kit-12kw",
    },
    {
      id: "kit-solaire-20kw",
      name: "Kit Solaire 20 kW",
      price: "15 800 € HT",
      image: "/images/portal/solar_panel_jinko.png",
      link: "/solaire/kit-20kw",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center bg-[#f8f9fa] overflow-hidden">
          <div className="absolute inset-0 z-0">
             <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl animate-fade-in-up">
              <span className="text-[#4A90D9] font-bold tracking-widest uppercase text-sm mb-4 block">IMPORT97</span>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#4A90D9] mb-6 leading-tight">
                L'Énergie <br/>Solaire.
              </h1>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-lg">
                Prenez le contrôle de votre énergie. Des solutions photovoltaïques performantes pour l'autonomie énergétique aux Antilles et en Guyane.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#solaire">
                  <Button className="btn-rippa h-14 px-8 text-base">
                    Découvrir la gamme
                  </Button>
                </a>
              </div>
            </div>
            <div className="hidden lg:block relative">
               <img 
                src="/images/portal/solar_panel.jpg" 
                alt="Panneaux Solaires" 
                className="w-full max-w-2xl object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500 rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Features Icons Bar */}
        <section className="bg-[#4A90D9] py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <Sun className="h-10 w-10 mb-4 text-white/80" />
                <h3 className="text-lg font-bold mb-2 text-white font-sans">Haute Performance</h3>
                <p className="text-white/60 text-sm max-w-xs">Panneaux monocristallins à haut rendement pour une production maximale.</p>
              </div>
              <div className="flex flex-col items-center">
                <Battery className="h-10 w-10 mb-4 text-white/80" />
                <h3 className="text-lg font-bold mb-2 text-white font-sans">Autonomie</h3>
                <p className="text-white/60 text-sm max-w-xs">Solutions de stockage pour une énergie disponible jour et nuit.</p>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="h-10 w-10 mb-4 text-white/80" />
                <h3 className="text-lg font-bold mb-2 text-white font-sans">Économies</h3>
                <p className="text-white/60 text-sm max-w-xs">Réduisez durablement vos factures d'électricité.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="solaire" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2 block">Notre Gamme</span>
              <h2 className="text-4xl font-serif font-bold text-[#4A90D9]">Solutions Photovoltaïques</h2>
              <div className="w-24 h-1 bg-[#4A90D9] mx-auto mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-6">Une étude solaire ?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Dimensionnez votre installation selon vos besoins réels. Nos experts vous conseillent pour optimiser votre production.
            </p>
            <a href="https://wa.me/33663284908" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="btn-rippa bg-transparent border-2 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white">
                Demander un devis
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
