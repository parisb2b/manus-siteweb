import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow flex items-center justify-center py-20">
        <div className="text-center px-4 max-w-lg">
          <h1 className="text-[120px] md:text-[160px] font-bold text-[#4A90D9] leading-none mb-2 font-serif">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Page introuvable
          </h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold px-8 py-6 text-base rounded-xl w-full sm:w-auto">
                <Home className="mr-2 h-5 w-5" />
                Retour à l'accueil
              </Button>
            </Link>
            <Link href="/minipelles">
              <Button variant="outline" className="border-2 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white font-bold px-8 py-6 text-base rounded-xl w-full sm:w-auto">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Voir nos produits
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
