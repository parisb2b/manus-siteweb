import { Truck, CreditCard, Wrench, MessageCircle, CheckCircle2, Camera, Clock, PackageCheck, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";

export default function Services() {
  const whatsappLink = "https://wa.me/33663284908";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <ScrollToTop />
      <Header />

      {/* Hero Section */}
      <div className="bg-white text-[#4A90D9] py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Nos Services & Engagements</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transparence, fiabilité et accompagnement complet pour votre activité dans les DOM TOM.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-8">
        
        {/* Livraison */}
        <section id="livraison" className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 scroll-mt-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-full">
              <Truck className="h-8 w-8 text-[#4A90D9]" />
            </div>
            <h2 className="text-3xl font-bold text-[#4A90D9]">Livraison DOM TOM</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                Nous assurons une logistique maîtrisée vers l'ensemble des territoires d'Outre-mer. 
                Que vous soyez en <strong>Martinique, Guadeloupe, Guyane, La Réunion</strong> ou ailleurs, 
                nous organisons le transport de votre commande en toute sécurité.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-4">
                <div>
                  <h3 className="font-bold text-[#4A90D9] mb-2 flex items-center gap-2">
                    <PackageCheck className="h-5 w-5" /> Préparation & Fabrication
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Selon le produit commandé et le stock disponible à l'usine, la préparation peut prendre <strong>entre 15 et 30 jours</strong>.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-bold text-[#4A90D9] mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Transport Maritime
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Comptez <strong>en moyenne 45 jours</strong> pour l'acheminement par bateau jusqu'à votre port de destination.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-6">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Plus d'infos sur WhatsApp
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-xl p-6 h-full flex flex-col justify-center">
               <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                   <span className="text-gray-700">Transport maritime sécurisé (Conteneur)</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                   <span className="text-gray-700">Suivi logistique personnalisé</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                   <span className="text-gray-700">Gestion des documents d'export</span>
                 </li>
                 <li className="flex items-start gap-3">
                   <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                   <span className="text-gray-700">Livraison port à port</span>
                 </li>
               </ul>
            </div>
          </div>
        </section>

        {/* Paiement */}
        <section id="paiement" className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 scroll-mt-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-full">
              <CreditCard className="h-8 w-8 text-[#4A90D9]" />
            </div>
            <h2 className="text-3xl font-bold text-[#4A90D9]">Livraison & Paiement</h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg text-gray-700 max-w-3xl">
              Nous proposons un échelonnement de paiement transparent par <strong>virement bancaire</strong>, calqué sur les étapes de production et de livraison de votre commande.
            </p>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Étape 1</div>
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">20%</div>
                <h3 className="font-bold text-gray-900 mb-2">A la commande</h3>
                <p className="text-sm text-gray-600">Acompte pour valider votre commande et lancer la préparation.</p>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Étape 2</div>
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">30%</div>
                <h3 className="font-bold text-gray-900 mb-2">Fin de préparation</h3>
                <p className="text-sm text-gray-600">Acompte une fois la production ou préparation terminée à l'usine.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Étape 3</div>
                <div className="text-4xl font-bold text-[#4A90D9] mb-2">30%</div>
                <h3 className="font-bold text-gray-900 mb-2">Départ Conteneur</h3>
                <p className="text-sm text-gray-600">Acompte avant le chargement et le départ du navire.</p>
              </div>

              {/* Step 4 */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Solde</div>
                <div className="text-4xl font-bold text-green-600 mb-2">20%</div>
                <h3 className="font-bold text-gray-900 mb-2">Arrivée à destination</h3>
                <p className="text-sm text-gray-600">Paiement final à l'arrivée, sous réserve de conformité et bonne réception.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
                <Camera className="h-6 w-6 text-[#4A90D9] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-[#4A90D9] mb-2">Suivi Visuel Complet</h3>
                  <p className="text-gray-700 text-sm">
                    Pour votre tranquillité d'esprit, <strong>des photos et vidéos vous sont envoyées à chaque étape</strong> (fabrication, chargement, expédition). 
                    Vous recevez également toutes les informations de tracking du conteneur.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 flex items-start gap-4">
                <FileCheck className="h-6 w-6 text-yellow-700 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-800 mb-2">Douanes & Fiscalité</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Le dédouanement (Octroi de Mer, TVA) est <strong>à la charge du client</strong> et payable à l'arrivée à notre partenaire transitaire agréé.
                  </p>
                  <p className="text-green-700 text-xs font-bold bg-green-100 px-2 py-1 rounded inline-block">
                    Option : Dossier de défiscalisation disponible (tarif à part)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SAV & Contact */}
        <section id="sav" className="bg-white rounded-2xl shadow-xl p-8 md:p-12 scroll-mt-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-full">
              <Wrench className="h-8 w-8 text-[#4A90D9]" />
            </div>
            <h2 className="text-3xl font-bold text-[#4A90D9]">SAV & Contact</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-lg text-gray-700 mb-6">
                Notre engagement ne s'arrête pas à la livraison. Nous assurons un suivi technique réactif pour garantir la disponibilité de votre matériel.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-green-100 p-3 rounded-lg h-fit">
                    <MessageCircle className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Contact Simple par WhatsApp</h3>
                    <p className="text-gray-600 text-sm">
                      En cas de problème ou pièce manquante, envoyez-nous simplement photos et vidéos via WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg h-fit">
                    <Clock className="h-6 w-6 text-[#4A90D9]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Réactivité 72h</h3>
                    <p className="text-gray-600 text-sm">
                      Nous traitons votre demande et contactons l'usine pour une solution sous 72 heures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-orange-100 p-3 rounded-lg h-fit">
                    <PackageCheck className="h-6 w-6 text-orange-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Solutions Concrètes</h3>
                    <p className="text-gray-600 text-sm">
                      Renvoi de pièces à nos frais et envoi de vidéos tutoriels pour vous guider dans la résolution du problème.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#4A90D9] rounded-xl p-8 text-white flex flex-col justify-center items-center text-center">
              <h3 className="text-2xl font-bold mb-4 text-white">Besoin d'assistance ?</h3>
              <p className="text-blue-200 mb-8">
                Notre équipe technique est disponible pour répondre à toutes vos questions.
              </p>
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-6 text-lg">
                  <MessageCircle className="mr-2 h-6 w-6" />
                  Contacter le SAV
                </Button>
              </a>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </div>
  );
}
