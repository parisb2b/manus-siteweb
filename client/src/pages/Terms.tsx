import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ScrollText, ShieldCheck, Truck, CreditCard, AlertTriangle, FileText, Scale, Users, Globe, Lock } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";

export default function Terms() {
  const { page } = usePageContent("terms");

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
              <h1 className="text-3xl font-bold text-[#4A90D9]">{page?.pageTitle || "Conditions Générales de Vente"}</h1>
            </div>

            {page?.content ? (
              <div className="prose prose-blue max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: page.content }} />
            ) : (
              <div className="prose prose-blue max-w-none text-gray-600">
                <p className="text-sm text-gray-500 italic mb-8">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Article 1 — Objet
                </h3>
                <p>
                  Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre la société <strong>[NOM DE LA SOCIÉTÉ — À COMPLÉTER]</strong>, ci-après dénommée « le Vendeur », et toute personne physique ou morale, ci-après dénommée « le Client », souhaitant procéder à un achat via le site internet 97 import.
                </p>
                <p>
                  Toute commande implique l'acceptation sans réserve des présentes CGV. Ces conditions prévaudront sur toute autre condition figurant dans tout autre document, sauf dérogation formelle et expresse.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Article 2 — Produits et Services
                </h3>
                <p>
                  Les produits proposés à la vente sont ceux décrits sur le site 97 import. Ils comprennent notamment : mini-pelles, maisons modulaires, panneaux solaires, machines agricoles et accessoires. Les photographies illustrant les produits n'entrent pas dans le champ contractuel.
                </p>
                <p>
                  Le Vendeur se réserve le droit de modifier à tout moment l'assortiment de produits. Les produits sont conformes à la législation française en vigueur et aux normes applicables dans les DOM-TOM.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Article 3 — Tarifs
                </h3>
                <p>
                  Les prix sont indiqués en Euros (€) Hors Taxes (HT), sauf mention contraire « Clé en main ». La TVA et l'Octroi de mer sont à la charge du Client lors de l'arrivée des marchandises dans les DOM-TOM, sauf si une prestation de dédouanement a été incluse dans le devis.
                </p>
                <p>
                  Le Vendeur se réserve le droit de modifier ses prix à tout moment. Les produits seront facturés sur la base des tarifs en vigueur au moment de la validation de la commande.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Article 4 — Commande et Devis
                </h3>
                <p>
                  Les commandes sont passées via le site, par WhatsApp ou par email. Chaque commande fait l'objet d'un devis détaillé envoyé au Client. La commande est considérée comme ferme après acceptation écrite du devis et réception de l'acompte.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Article 5 — Modalités de Paiement
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Acompte :</strong> Un acompte de 30% à 50% est exigé à la commande pour lancer la fabrication ou la réservation.</li>
                  <li><strong>Solde :</strong> Le solde est dû avant l'embarquement des marchandises ou contre remise des documents d'expédition (Bill of Lading).</li>
                  <li><strong>Moyens de paiement :</strong> Virement bancaire uniquement.</li>
                </ul>
                <p>
                  En cas de retard de paiement, des pénalités de retard seront appliquées conformément à l'article L.441-10 du Code de commerce.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Article 6 — Livraison et Transport
                </h3>
                <p>
                  Les délais de livraison sont donnés à titre indicatif (généralement 45 à 60 jours pour les DOM-TOM). Le transfert des risques s'effectue selon l'incoterm convenu (généralement CIF ou DAP). Le Client est responsable du dédouanement et du paiement des taxes locales à l'arrivée, sauf si une prestation de transitaire a été incluse dans le devis.
                </p>
                <p>
                  En cas de retard de livraison supérieur à 30 jours par rapport à la date estimée, le Client pourra demander la résolution de la vente par lettre recommandée avec accusé de réception.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Article 7 — Garanties et SAV
                </h3>
                <p>
                  <strong>Garantie Constructeur :</strong> Nos produits bénéficient d'une garantie constructeur (durée variable selon le produit, généralement 1 à 2 ans sur les pièces principales). Cette garantie couvre les défauts de fabrication mais exclut l'usure normale et les dommages causés par une mauvaise utilisation.
                </p>
                <p>
                  <strong>Service Après-Vente :</strong> Le SAV est assuré par nos équipes ou partenaires agréés. Les pièces détachées sont expédiées sous 72h en cas de disponibilité stock, ou commandées express depuis l'usine.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Article 8 — Droit de Rétractation
                </h3>
                <p>
                  Conformément à l'article L.221-18 du Code de la consommation, le Client particulier dispose d'un délai de rétractation de 14 jours à compter de la réception du bien. Toutefois, conformément à l'article L.221-28, ce droit ne s'applique pas :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Aux produits confectionnés sur mesure ou nettement personnalisés (ex : maisons modulaires avec plans spécifiques)</li>
                  <li>Aux produits dont la fabrication a été lancée suite à la commande</li>
                </ul>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Scale className="w-5 h-5" /> Article 9 — Responsabilité
                </h3>
                <p>
                  Le Vendeur ne saurait être tenu responsable de l'inexécution du contrat en cas de force majeure, de perturbation ou grève totale ou partielle des services postaux et moyens de transport et/ou communications. Le Vendeur ne pourra être tenu pour responsable des dommages résultant d'une mauvaise utilisation du produit acheté.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Article 10 — Données Personnelles
                </h3>
                <p>
                  Les informations recueillies lors de la commande font l'objet d'un traitement informatique destiné à la gestion des commandes. Conformément au RGPD, le Client dispose d'un droit d'accès, de rectification et de suppression de ses données. Pour plus d'informations, consultez notre <a href="/privacy" className="text-[#4A90D9] hover:underline">Politique de Confidentialité</a>.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Scale className="w-5 h-5" /> Article 11 — Litiges et Droit Applicable
                </h3>
                <p>
                  Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. À défaut de résolution amiable dans un délai de 30 jours, le litige sera porté devant le Tribunal de Commerce de <strong>[VILLE D'IMMATRICULATION — À COMPLÉTER]</strong>.
                </p>
                <p>
                  Conformément à l'article L.612-1 du Code de la consommation, le Client peut recourir à un médiateur de la consommation. Le médiateur compétent est : <strong>[NOM DU MÉDIATEUR — À COMPLÉTER]</strong>.
                </p>

              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
