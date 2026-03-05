import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { ShieldCheck, Truck, HeadphonesIcon, Target, Heart, Users, Globe, Award, Handshake } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <ScrollToTop />
      <Header />

      {/* Hero Section */}
      <div className="bg-white text-[#4A90D9] py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Qui sommes-nous</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            97 import est spécialisé dans l'importation de produits depuis la Chine vers les DOM-TOM.
            Forts de notre expertise, nous proposons des solutions adaptées aux besoins des professionnels
            et particuliers en Martinique, Guadeloupe, Guyane, Réunion et Mayotte.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8">

        {/* Notre Mission */}
        <section className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#4A90D9] mb-6">Notre Mission</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Simplifier l'importation de produits de qualité depuis la Chine vers les territoires d'outre-mer.
                Nous gérons l'intégralité de la chaîne logistique : sourcing, contrôle qualité, transport maritime
                et livraison finale.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Notre objectif : rendre accessible aux DOM-TOM des équipements performants à des prix compétitifs,
                avec un service client dédié et réactif.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Globe className="h-8 w-8 text-[#4A90D9] mx-auto mb-3" />
                <span className="text-2xl font-bold text-[#4A90D9] block">5+</span>
                <span className="text-sm text-gray-500">Territoires desservis</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Award className="h-8 w-8 text-[#4A90D9] mx-auto mb-3" />
                <span className="text-2xl font-bold text-[#4A90D9] block">100%</span>
                <span className="text-sm text-gray-500">Contrôle qualité</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Truck className="h-8 w-8 text-[#4A90D9] mx-auto mb-3" />
                <span className="text-2xl font-bold text-[#4A90D9] block">2-30j</span>
                <span className="text-sm text-gray-500">Délai moyen</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Handshake className="h-8 w-8 text-[#4A90D9] mx-auto mb-3" />
                <span className="text-2xl font-bold text-[#4A90D9] block">SAV</span>
                <span className="text-sm text-gray-500">Dédié 24/7</span>
              </div>
            </div>
          </div>
        </section>

        {/* Nos Valeurs */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A90D9] text-center mb-10">Nos Valeurs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
                <ShieldCheck className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Qualité</h3>
              <p className="text-gray-600">
                Chaque produit est rigoureusement sélectionné et contrôlé avant expédition.
                Nous travaillons uniquement avec des usines certifiées.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
                <Target className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fiabilité</h3>
              <p className="text-gray-600">
                Respect des délais, transparence sur les prix et suivi logistique en temps réel.
                Votre confiance est notre priorité.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
                <Heart className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Service Client</h3>
              <p className="text-gray-600">
                Une équipe dédiée, disponible 24/7 via WhatsApp, pour vous accompagner
                avant, pendant et après votre achat.
              </p>
            </div>
          </div>
        </section>

        {/* Nos Engagements */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#4A90D9] text-center mb-10">Nos Engagements</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-6">
                <Truck className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Livraison Sécurisée</h3>
              <p className="text-gray-600">
                Transport maritime dans des conteneurs dédiés, avec assurance et suivi
                jusqu'à votre port de destination.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-6">
                <HeadphonesIcon className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">SAV Dédié</h3>
              <p className="text-gray-600">
                Service après-vente réactif avec envoi de pièces détachées sous 72h
                et assistance technique par WhatsApp.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-6">
                <Users className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Prix Compétitifs</h3>
              <p className="text-gray-600">
                Importation directe usine, sans intermédiaire. Des prix justes
                pour des produits professionnels.
              </p>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}
