import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ScrollText, ShieldCheck, Truck, CreditCard } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#4A90D9]">
                <ScrollText className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-[#4A90D9]">Conditions Générales de Vente</h1>
            </div>

            <div className="prose prose-blue max-w-none text-gray-600">
              <p className="text-sm text-gray-500 italic mb-8">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                1. Objet
              </h3>
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre la société <strong>[NOM DE LA SOCIÉTÉ À COMPLÉTER]</strong> (ci-après "le Vendeur") et toute personne physique ou morale (ci-après "le Client") souhaitant procéder à un achat via le site internet Import 97.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                2. Produits et Conformité
              </h3>
              <p>
                Les produits proposés sont ceux qui figurent sur le site Import 97 (Mini-pelles, Maisons Modulaires, Panneaux Solaires, Machines Agricoles). Ces produits sont importés et conformes aux normes en vigueur. Les photographies ne sont pas contractuelles. Le Vendeur se réserve le droit de modifier à tout moment l'assortiment de produits.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> 3. Tarifs et Modalités de Paiement
              </h3>
              <p>
                Les prix sont indiqués en Euros (€) Hors Taxes (HT). La TVA et l'Octroi de mer sont à la charge du Client lors de l'arrivée des marchandises aux Antilles/Guyane/Réunion, sauf mention contraire "Clé en main".
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Acompte :</strong> Un acompte de 30% à 50% est exigé à la commande pour lancer la fabrication ou la réservation.</li>
                <li><strong>Solde :</strong> Le solde est dû avant l'embarquement des marchandises ou contre remise des documents d'expédition (Bill of Lading).</li>
                <li><strong>Moyens de paiement :</strong> Virement bancaire uniquement.</li>
              </ul>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                <Truck className="w-5 h-5" /> 4. Livraison et Transport
              </h3>
              <p>
                Les délais de livraison sont donnés à titre indicatif (généralement 45 à 60 jours pour les DOM-TOM). Le transfert des risques s'effectue selon l'incoterm convenu (généralement CIF ou DAP).
              </p>
              <p>
                Le Client est responsable du dédouanement et du paiement des taxes locales à l'arrivée, sauf si une prestation de transitaire a été incluse dans le devis.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> 5. Garanties et SAV
              </h3>
              <p>
                <strong>Garantie Constructeur :</strong> Nos produits bénéficient d'une garantie constructeur (durée variable selon le produit, généralement 1 à 2 ans sur les pièces principales).
              </p>
              <p>
                <strong>Service Après-Vente :</strong> Le SAV est assuré par nos équipes locales ou partenaires agréés. Les pièces détachées sont expédiées sous 72h en cas de disponibilité stock, ou commandées express depuis l'usine.
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                6. Rétractation
              </h3>
              <p>
                Conformément à la législation en vigueur, pour les ventes à distance, le Client particulier dispose d'un délai de rétractation de 14 jours. Toutefois, ce droit ne s'applique pas aux produits confectionnés sur mesure ou nettement personnalisés (ex: Maisons Modulaires avec plans spécifiques).
              </p>

              <h3 className="text-[#4A90D9] flex items-center gap-2">
                7. Litiges
              </h3>
              <p>
                Tout litige relatif à l'interprétation et à l'exécution des présentes CGV est soumis au droit français. À défaut de résolution amiable, le litige sera porté devant le Tribunal de Commerce de <strong>[VILLE D'IMMATRICULATION À COMPLÉTER]</strong>.
              </p>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
