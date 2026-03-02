import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Eye, Database, Cookie } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-700">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-[#4A90D9]">Politique de Confidentialité</h1>
            </div>

            <div className="prose prose-blue max-w-none text-gray-600">
              <p>
                La protection de vos données personnelles est une priorité pour Import 97. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                <Database className="w-5 h-5" /> 1. Collecte des Données
              </h3>
              <p>
                Nous collectons les informations que vous nous fournissez directement lorsque :
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Vous remplissez un formulaire de contact ou de demande de devis.</li>
                <li>Vous nous contactez par email ou téléphone.</li>
                <li>Vous naviguez sur notre site (via des cookies techniques).</li>
              </ul>
              <p>
                Les données collectées peuvent inclure : Nom, Prénom, Adresse email, Numéro de téléphone, Adresse de livraison.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                <Eye className="w-5 h-5" /> 2. Utilisation des Données
              </h3>
              <p>
                Vos données sont utilisées exclusivement pour :
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Traiter vos commandes et organiser la livraison.</li>
                <li>Répondre à vos demandes de renseignements et devis.</li>
                <li>Vous envoyer des informations sur votre commande (suivi logistique).</li>
                <li>Améliorer notre site et nos services.</li>
              </ul>
              <p>
                <strong>Nous ne vendons jamais vos données à des tiers.</strong>
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                <Cookie className="w-5 h-5" /> 3. Cookies
              </h3>
              <p>
                Notre site utilise des cookies pour améliorer votre expérience de navigation et mesurer l'audience. Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                4. Vos Droits
              </h3>
              <p>
                Conformément au RGPD (Règlement Général sur la Protection des Données), vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données.
              </p>
              <p>
                Pour exercer ces droits, contactez-nous à : <strong>import97@sasfr.com</strong>
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                5. Sécurité
              </h3>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès non autorisé, perte ou altération.
              </p>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
