import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { usePageContent } from "@/hooks/useSiteContent";

export default function Solar() {
  const { products, loading } = useProducts("Solaire");
  const { page } = usePageContent("solaire");

  const displayProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.priceDisplay,
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
              <h2 className="text-4xl font-serif font-bold text-[#4A90D9]">{page?.pageTitle || "Solutions Photovoltaïques"}</h2>
              <div className="w-24 h-1 bg-[#4A90D9] mx-auto mt-6"></div>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">Chargement...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {displayProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-bold text-[#4A90D9] mb-6">{page?.ctaTitle || "Une étude solaire ?"}</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {page?.ctaDescription || "Dimensionnez votre installation selon vos besoins réels. Nos experts vous conseillent pour optimiser votre production."}
            </p>
            <a href={page?.ctaButtonLink || "https://wa.me/33663284908"} {...(page?.ctaButtonExternal !== false ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <Button variant="outline" className="btn-rippa bg-transparent border-2 border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white">
                {page?.ctaButtonText || "Demander un devis"}
              </Button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
