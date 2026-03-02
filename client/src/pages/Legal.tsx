import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Scale, Building, User, Server } from "lucide-react";

export default function Legal() {
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
              <h1 className="text-3xl font-bold text-[#4A90D9]">Mentions Légales</h1>
            </div>

            <div className="space-y-8">
              
              {/* Éditeur du Site */}
              <div className="border-b border-gray-100 pb-8">
                <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                  <Building className="w-5 h-5" /> Éditeur du Site
                </h3>
                <div className="bg-blue-50/50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                  <p><strong>Dénomination Sociale :</strong> [À COMPLÉTER]</p>
                  <p><strong>Forme Juridique :</strong> [À COMPLÉTER] (ex: SAS, SARL)</p>
                  <p><strong>Capital Social :</strong> [À COMPLÉTER] €</p>
                  <p><strong>Siège Social :</strong> [À COMPLÉTER]</p>
                  <p><strong>RCS :</strong> [À COMPLÉTER] (Ville)</p>
                  <p><strong>SIRET :</strong> [À COMPLÉTER]</p>
                  <p><strong>Numéro de TVA Intracommunautaire :</strong> [À COMPLÉTER]</p>
                </div>
              </div>

              {/* Contact */}
              <div className="border-b border-gray-100 pb-8">
                <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                  <User className="w-5 h-5" /> Contact
                </h3>
                <div className="bg-green-50/50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                  <p><strong>Email :</strong> import97@sasfr.com</p>
                  <p><strong>Téléphone :</strong> +33 6 63 28 49 08 / +33 6 20 60 74 48</p>
                  <p><strong>Directeur de la Publication :</strong> [À COMPLÉTER]</p>
                </div>
              </div>

              {/* Hébergement */}
              <div>
                <h3 className="text-xl font-bold text-[#4A90D9] flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5" /> Hébergement
                </h3>
                <div className="bg-gray-50 p-6 rounded-xl text-sm text-gray-700 space-y-2">
                  <p><strong>Hébergeur :</strong> [À COMPLÉTER]</p>
                  <p><strong>Adresse :</strong> [À COMPLÉTER]</p>
                  <p><strong>Site Web :</strong> [À COMPLÉTER]</p>
                </div>
              </div>

              <div className="mt-8 text-xs text-gray-400 italic">
                Ce site respecte le droit d'auteur. Tous les droits des auteurs des œuvres protégées reproduites et communiquées sur ce site, sont réservés. Sauf autorisation, toute utilisation des œuvres autres que la reproduction et la consultation individuelles et privées sont interdites.
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
