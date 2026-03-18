import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PrixOuDevis from "@/components/PrixOuDevis";
import ScrollToTop from "@/components/ScrollToTop";

export default function Solar() {
  const products = [
    {
      id: "kit-solaire-10kw",
      name: "Kit Solaire 10 kW",
      priceElement: <PrixOuDevis prix="7 990 € HT" />,
      image: "/images/products/solar_kits/tiger_neo_585w.avif",
      link: "/solaire/kit-10kw",
    },
    {
      id: "kit-solaire-12kw",
      name: "Kit Solaire 12 kW",
      priceElement: <PrixOuDevis prix="8 990 € HT" />,
      image: "/images/products/solar_kits/tiger_neo_585w.avif",
      link: "/solaire/kit-12kw",
    },
    {
      id: "kit-solaire-20kw",
      name: "Kit Solaire 20 kW",
      priceElement: <PrixOuDevis prix="18 990 € HT" />,
      image: "/images/products/solar_kits/tiger_neo_585w.avif",
      link: "/solaire/kit-20kw",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <ScrollToTop />
      <Header />

      <main>
        {/* Products Section — direct entry */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2 block">Notre Gamme</span>
              <h1 className="text-4xl font-serif font-bold text-[#4A90D9]">Solutions Photovoltaïques</h1>
              <div className="w-24 h-1 bg-[#4A90D9] mx-auto mt-6"></div>
              <p className="text-gray-600 text-lg mt-6 max-w-2xl mx-auto">
                Prenez le contrôle de votre énergie. Des solutions performantes pour l'autonomie énergétique aux Antilles et en Guyane.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
