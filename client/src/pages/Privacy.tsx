import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Eye, Database, Cookie, Shield, Clock, UserCheck, Mail, Server, FileCheck } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";

export default function Privacy() {
  const { page } = usePageContent("privacy");

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
              <h1 className="text-3xl font-bold text-[#4A90D9]">{page?.pageTitle || "Politique de Confidentialité"}</h1>
            </div>

            {page?.content ? (
              <div className="prose prose-blue max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: page.content }} />
            ) : (
              <div className="prose prose-blue max-w-none text-gray-600">
                <p className="text-sm text-gray-500 italic mb-8">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')} — Conforme au RGPD (Règlement UE 2016/679)
                </p>

                <p>
                  La protection de vos données personnelles est une priorité pour 97 import. Cette politique de confidentialité explique comment nous collectons, utilisons, conservons et protégeons vos informations conformément au Règlement Général sur la Protection des Données (RGPD).
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Shield className="w-5 h-5" /> 1. Responsable du Traitement
                </h3>
                <div className="bg-blue-50/50 p-4 rounded-xl text-sm space-y-1">
                  <p><strong>Société :</strong> LUXENT LIMITED</p>
                  <p><strong>Adresse :</strong> 2nd Floor College House, 17 King Edwards Road, Ruislip, London HA4 7AE, United Kingdom</p>
                  <p><strong>Company Number :</strong> 14852122</p>
                  <p><strong>Email :</strong> info@97import.com</p>
                  <p><strong>Téléphone :</strong> +33 6 63 28 49 08</p>
                </div>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Database className="w-5 h-5" /> 2. Données Collectées
                </h3>
                <p>
                  Nous collectons les informations que vous nous fournissez directement lorsque :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Vous créez un compte sur notre site</li>
                  <li>Vous remplissez un formulaire de contact ou de demande de devis</li>
                  <li>Vous passez une commande</li>
                  <li>Vous nous contactez par email, téléphone ou WhatsApp</li>
                  <li>Vous naviguez sur notre site (données de navigation via cookies)</li>
                </ul>
                <p>
                  <strong>Données concernées :</strong> Nom, prénom, adresse email, numéro de téléphone, adresse postale/de livraison, historique de navigation sur le site.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Eye className="w-5 h-5" /> 3. Finalité du Traitement
                </h3>
                <p>
                  Vos données sont utilisées exclusivement pour :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Traiter vos commandes et organiser la livraison</li>
                  <li>Répondre à vos demandes de renseignements et devis</li>
                  <li>Vous envoyer des informations sur votre commande (suivi logistique)</li>
                  <li>Gérer votre compte client</li>
                  <li>Améliorer notre site et nos services (statistiques anonymisées)</li>
                  <li>Respecter nos obligations légales et réglementaires</li>
                </ul>
                <p>
                  <strong>Nous ne vendons jamais vos données à des tiers.</strong> Vos données ne sont partagées qu'avec nos prestataires strictement nécessaires (transporteurs, transitaires).
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <FileCheck className="w-5 h-5" /> 4. Base Légale du Traitement
                </h3>
                <p>
                  Conformément à l'article 6 du RGPD, le traitement de vos données repose sur :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>L'exécution du contrat :</strong> traitement de commande, livraison, SAV</li>
                  <li><strong>Le consentement :</strong> cookies non essentiels, newsletter</li>
                  <li><strong>L'intérêt légitime :</strong> amélioration du site, statistiques</li>
                  <li><strong>L'obligation légale :</strong> facturation, archivage comptable</li>
                </ul>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Clock className="w-5 h-5" /> 5. Durée de Conservation
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Données clients :</strong> 3 ans après le dernier contact</li>
                  <li><strong>Données de commande :</strong> 10 ans (obligation comptable)</li>
                  <li><strong>Cookies :</strong> 13 mois maximum</li>
                  <li><strong>Données de navigation :</strong> 25 mois maximum</li>
                </ul>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <UserCheck className="w-5 h-5" /> 6. Vos Droits (RGPD)
                </h3>
                <p>
                  Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
                  <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                  <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous à : <strong>info@97import.com</strong>. Nous nous engageons à répondre dans un délai de 30 jours.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Mail className="w-5 h-5" /> 7. Délégué à la Protection des Données (DPO)
                </h3>
                <div className="bg-blue-50/50 p-4 rounded-xl text-sm space-y-1">
                  <p><strong>Contact DPO :</strong> [NOM DU DPO — À COMPLÉTER]</p>
                  <p><strong>Email :</strong> [EMAIL DPO — À COMPLÉTER]</p>
                </div>
                <p className="text-sm mt-2">
                  En cas de difficulté, vous pouvez adresser une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#4A90D9] hover:underline">www.cnil.fr</a>
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Cookie className="w-5 h-5" /> 8. Cookies
                </h3>
                <p>
                  Notre site utilise des cookies pour améliorer votre expérience de navigation. Lors de votre première visite, un bandeau vous permet d'accepter ou de refuser les cookies non essentiels.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (session, panier)</li>
                  <li><strong>Cookies analytiques :</strong> mesure d'audience anonymisée</li>
                </ul>
                <p>
                  Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies. La suppression des cookies peut altérer votre expérience de navigation.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Server className="w-5 h-5" /> 9. Hébergeur des Données
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-1">
                  <p><strong>Hébergeur :</strong> Vercel Inc.</p>
                  <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
                  <p><strong>Site Web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#4A90D9] hover:underline">vercel.com</a></p>
                </div>
                <p className="text-sm mt-2">
                  Les transferts de données hors UE sont encadrés par les clauses contractuelles types de la Commission européenne.
                </p>

                <h3 className="text-[#4A90D9] flex items-center gap-2">
                  <Lock className="w-5 h-5" /> 10. Sécurité des Données
                </h3>
                <p>
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, altération ou divulgation. Notre site utilise le protocole HTTPS pour sécuriser les échanges de données.
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
