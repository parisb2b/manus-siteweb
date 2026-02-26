import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Truck, ShieldCheck, PenTool } from "lucide-react";

export default function Home() {
  const proProducts = [
    {
      id: "r18-pro",
      name: "R18 PRO",
      price: "12 400,00 EUR HT",
      image: "/images/products/r18_pro.webp",
      link: "/products/r18-pro",
    },
    {
      id: "r22-pro",
      name: "R22 PRO",
      price: "15 795,00 EUR HT",
      image: "/images/products/r22_pro_main.webp",

      link: "/products/r22-pro",
    },
    {
      id: "r32-pro",
      name: "R32 PRO",
      price: "18 585,00 EUR HT",
      image: "/images/products/r32_pro.webp",
      link: "/products/r32-pro",
    },
    {
      id: "r57-pro",
      name: "R57 PRO",
      price: "25 900,00 EUR HT",
      image: "/images/products/r57_pro/r57_pro_main_view.png",
      link: "/products/r57-pro",
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <main>
        {/* Hero Section - Original Style */}
        <section className="relative h-[600px] flex items-center bg-[#f8f9fa] overflow-hidden">
          <div className="absolute inset-0 z-0">
             {/* Background Image Placeholder or Gradient */}
             <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl animate-fade-in-up">
              <span className="text-[#1a1a5e] font-bold tracking-widest uppercase text-sm mb-4 block">Rippa DOM TOM</span>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#1a1a5e] mb-6 leading-tight">
                L'excellence <br/>Compacte.
              </h1>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-lg">
                Découvrez la série Pro. Une ingénierie de précision pour les professionnels exigeants qui ne font aucun compromis sur la puissance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#minipelles">
                  <Button className="btn-rippa h-14 px-8 text-base">
                    Découvrir la gamme
                  </Button>
                </a>

              </div>
            </div>
            <div className="hidden lg:block relative">
               <img 
                src="/images/products/r32_pro.webp" 
                alt="Rippa R32 Pro" 
                className="w-full max-w-2xl object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </section>

        {/* Features Icons Bar */}
        <section className="bg-[#1a1a5e] py-12 text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <Truck className="h-10 w-10 mb-4 text-white/80" />
                <h3 className="text-lg font-bold mb-2 text-white font-sans">Expédition DOM TOM</h3>
                <p className="text-white/60 text-sm max-w-xs">Livraison sécurisée sous 45 jours vers Martinique, Guadeloupe et Guyane.</p>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-10 w-10 mb-4 text-white/80" />
                <h3 className="text-lg font-bold mb-2 text-white font-sans">Garantie & Support</h3>
                <p className="text-white/60 text-sm max-w-xs">Service après-vente dédié et pièces détachées disponibles localement.</p>
              </div>
              <div className="flex flex-col items-center">
                <PenTool className="h-10 w-10 mb-4 text-white/80" />
                <h3 className="text-lg font-bold mb-2 text-white font-sans">Qualité Pro</h3>
                <p className="text-white/60 text-sm max-w-xs">Machines conçues pour une utilisation intensive et professionnelle.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="minipelles" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2 block">Notre Gamme</span>
              <h2 className="text-4xl font-serif font-bold text-[#1a1a5e]">Mini-pelles Série Pro</h2>
              <div className="w-24 h-1 bg-[#1a1a5e] mx-auto mt-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {proProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold text-[#1a1a5e] mb-6">Besoin d'accessoires ?</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Optimisez votre mini-pelle avec notre gamme complète d'accessoires : godets, marteaux, tarières et plus encore.
            </p>
            <a href="/accessoires">
              <Button variant="outline" className="btn-rippa bg-transparent border-2 border-[#1a1a5e] text-[#1a1a5e] hover:bg-[#1a1a5e] hover:text-white">
                Voir tous les accessoires
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
