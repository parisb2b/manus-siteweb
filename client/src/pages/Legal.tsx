import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Building, User, Server, Globe, ShieldCheck } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";

export default function Legal() {
  const { page } = usePageContent("legal");

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700">
                <Scale className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-[#4A90D9]">{page?.pageTitle || "Mentions Légales"}</h1>
            </div>

            {page?.content ? (
              <div className="prose prose-blue max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: page.content }} />
            ) : (
              <div className="space-y-8">

                <p className="text-sm text-gray-500 italic">
                  Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), il est porté à la connaissance des utilisateurs du site 97 import les informations suivantes :
                </p>

                {/* Éditeur du Site */}
                <div className="border-b border-gray-100 pb-8">
                  <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5" /> 1. Éditeur du Site
                  </h3>
                  <div className="bg-blue-50/50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                    <p><strong>Dénomination Sociale :</strong> LUXENT LIMITED</p>
                    <p><strong>Forme Juridique :</strong> Private Limited Company</p>
                    <p><strong>Siège Social :</strong> 2nd Floor College House, 17 King Edwards Road, Ruislip, London HA4 7AE, United Kingdom</p>
                    <p><strong>Numéro d'enregistrement :</strong> 14852122</p>
                  </div>
                </div>

                {/* Directeur de la publication */}
                <div className="border-b border-gray-100 pb-8">
                  <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                    <User className="w-5 h-5" /> 2. Directeur de la Publication
                  </h3>
                  <div className="bg-green-50/50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                    <p><strong>Directeur de la Publication :</strong> CHEN Michel</p>
                    <p><strong>Qualité :</strong> Président</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="border-b border-gray-100 pb-8">
                  <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5" /> 3. Contact
                  </h3>
                  <div className="bg-blue-50/50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                    <p><strong>Email :</strong> info@97import.com</p>
                    <p><strong>Téléphone :</strong> +33 6 63 28 49 08 / +33 6 20 60 74 48</p>
                    <p><strong>WhatsApp :</strong> +33 6 63 28 49 08 / +33 6 20 60 74 48</p>
                  </div>
                </div>

                {/* Hébergement */}
                <div className="border-b border-gray-100 pb-8">
                  <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                    <Server className="w-5 h-5" /> 4. Hébergement
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                    <p><strong>Hébergeur :</strong> Vercel Inc.</p>
                    <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
                    <p><strong>Site Web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#4A90D9] hover:underline">vercel.com</a></p>
                  </div>
                </div>

                {/* Propriété intellectuelle */}
                <div className="border-b border-gray-100 pb-8">
                  <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5" /> 5. Propriété Intellectuelle
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    L'ensemble du contenu de ce site (textes, images, logos, vidéos, éléments graphiques, structure) est protégé par le droit d'auteur et le droit de la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de la société éditrice.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">
                    Les marques et logos reproduits sur ce site sont déposés par les sociétés qui en sont propriétaires.
                  </p>
                </div>

                {/* Protection des données */}
                <div>
                  <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                    <Scale className="w-5 h-5" /> 6. Protection des Données Personnelles
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mt-3">
                    Pour en savoir plus, consultez notre <a href="/privacy" className="text-[#4A90D9] font-semibold hover:underline">Politique de Confidentialité</a>.
                  </p>
                </div>

                <div className="mt-8 text-xs text-gray-400 italic border-t border-gray-100 pt-6">
                  Ce site respecte le droit d'auteur. Tous les droits des auteurs des œuvres protégées reproduites et communiquées sur ce site sont réservés. Sauf autorisation, toute utilisation des œuvres autres que la reproduction et la consultation individuelles et privées sont interdites.
                </div>

              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
