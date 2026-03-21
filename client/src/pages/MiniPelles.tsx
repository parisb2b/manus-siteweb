import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PrixOuDevis from "@/components/PrixOuDevis";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { usePageContent } from "@/hooks/useSiteContent";
import { MINI_PELLES_PRIX } from "@/data/pricing";

export default function Home() {
  const { products, loading } = useProducts("Mini-pelles");
  const { page } = usePageContent("minipelles");

  const proProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    priceElement: <PrixOuDevis prixAchat={p.price || (MINI_PELLES_PRIX[p.id] ?? 9538)} />,
    image: p.image,
    link: p.link,
  }));

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main>
        {/* Products Section - Direct access */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2 block">{page?.pageSubtitle || "NOTRE GAMME"}</span>
              <h2 className="text-4xl font-serif font-bold text-[#4A90D9]">{page?.pageTitle || "Mini-pelles Série Pro"}</h2>
              <div className="w-24 h-1 bg-[#4A90D9] mx-auto mt-6"></div>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">Chargement...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {proProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-6">{page?.ctaTitle || "Besoin d'accessoires ?"}</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {page?.ctaDescription || "Optimisez votre mini-pelle avec notre gamme complète d'accessoires : godets, marteaux, tarières et plus encore."}
            </p>
            <a href={page?.ctaButtonLink || "/accessoires"} {...(page?.ctaButtonExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <Button variant="outline" className="btn-rippa bg-transparent border-2 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white">
                {page?.ctaButtonText || "Voir tous les accessoires"}
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
