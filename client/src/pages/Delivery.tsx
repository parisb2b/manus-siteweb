import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { MessageCircle, ArrowRight, ShoppingCart, ClipboardList, CreditCard, Factory, Ship, MapPin, Package, Container, Layers, AlertTriangle, ShieldCheck, Info, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const STEPS = [
  {
    num: 1,
    title: "Demande de devis",
    description: "Vous constituez votre panier et envoyez votre demande via WhatsApp.",
    icon: ClipboardList,
  },
  {
    num: 2,
    title: "Confirmation et paiement",
    description: "Nous validons ensemble votre commande et les modalités de paiement.",
    icon: CreditCard,
  },
  {
    num: 3,
    title: "Préparation",
    description: "Vos produits sont préparés et contrôlés en usine.",
    icon: Factory,
  },
  {
    num: 4,
    title: "Expédition maritime",
    description: "Chargement en conteneur et transport par voie maritime.",
    icon: Ship,
  },
  {
    num: 5,
    title: "Réception",
    description: "Livraison au port de destination, dédouanement et mise à disposition.",
    icon: MapPin,
  },
];

const DESTINATIONS = [
  { name: "Martinique", delay: "35-45 jours", available: true },
  { name: "Guadeloupe", delay: "35-45 jours", available: true },
  { name: "Guyane", delay: "40-55 jours", available: true },
  { name: "Réunion", delay: "45-60 jours", available: true },
  { name: "Mayotte", delay: "45-60 jours", available: true },
  { name: "Autre destination", delay: "Sur demande", available: false },
];

const CONTAINERS = [
  {
    icon: Package,
    title: "Conteneur 20 pieds",
    volume: "~33 m³",
    description: "Idéal pour mini-pelles, accessoires, kits solaires.",
  },
  {
    icon: Container,
    title: "Conteneur 40 pieds",
    volume: "~67 m³",
    description: "Idéal pour maisons modulaires + options.",
  },
  {
    icon: Layers,
    title: "Groupage",
    volume: "Variable",
    description: "Possibilité d'expédition en groupage pour les petits volumes.",
  },
];

const INCLUDED = [
  "Transport maritime",
  "Assurance transport",
  "Manutention portuaire",
];

const NOT_INCLUDED = [
  "Dédouanement",
  "Octroi de mer",
  "TVA locale",
  "Transport du port au domicile",
];

export default function Delivery() {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      "Bonjour, je souhaite obtenir un devis de livraison pour ma commande."
    );
    window.open(`https://wa.me/33663284908?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <ScrollToTop />
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-[#4A90D9]">Accueil</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Livraison</span>
          </div>

          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#4A90D9] mb-4">
              Informations Livraison DOM-TOM
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Nous assurons la livraison de tous nos produits vers les départements et territoires d'outre-mer par voie maritime.
            </p>
          </div>

          {/* SECTION 1: Processus de livraison */}
          <section className="mb-20">
            <h2 className="text-2xl font-serif font-bold text-[#4A90D9] text-center mb-12">
              Notre Processus de Livraison
            </h2>

            <div className="relative">
              {/* Timeline line (desktop) */}
              <div className="hidden lg:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-[#4A90D9]/20" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.num} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 w-14 h-14 rounded-full bg-[#4A90D9] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-[#4A90D9] uppercase tracking-wider mb-2">
                        Étape {step.num}
                      </span>
                      <h3 className="font-bold text-gray-900 text-sm mb-2">{step.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 2: Destinations */}
          <section className="mb-20">
            <h2 className="text-2xl font-serif font-bold text-[#4A90D9] text-center mb-12">
              Destinations Desservies
            </h2>

            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 px-6 py-4 text-xs font-bold uppercase text-gray-500 tracking-wider border-b border-gray-200">
                <div>Destination</div>
                <div className="text-center">Délai estimé</div>
                <div className="text-right">Disponibilité</div>
              </div>

              {DESTINATIONS.map((dest, idx) => (
                <div
                  key={dest.name}
                  className={`grid grid-cols-3 gap-4 items-center px-6 py-4 ${
                    idx < DESTINATIONS.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{dest.name}</div>
                  <div className="text-center text-sm text-gray-600">{dest.delay}</div>
                  <div className="text-right">
                    {dest.available ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                        <span>&#10003;</span> Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-[#4A90D9] font-medium">
                        <Phone className="w-3.5 h-3.5" /> Contactez-nous
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: Types de transport */}
          <section className="mb-20">
            <h2 className="text-2xl font-serif font-bold text-[#4A90D9] text-center mb-12">
              Types de Transport
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {CONTAINERS.map((container) => {
                const Icon = container.icon;
                return (
                  <div
                    key={container.title}
                    className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-[#4A90D9] flex items-center justify-center mx-auto mb-5">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{container.title}</h3>
                    <p className="text-2xl font-bold text-[#4A90D9] mb-3">{container.volume}</p>
                    <p className="text-sm text-gray-500">{container.description}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-gray-500 mt-8 max-w-2xl mx-auto">
              Les frais de livraison sont calculés en fonction du volume total de votre commande. Contactez-nous pour un devis personnalisé.
            </p>
          </section>

          {/* SECTION 4: Informations importantes */}
          <section className="mb-20">
            <h2 className="text-2xl font-serif font-bold text-[#4A90D9] text-center mb-12">
              Informations Importantes
            </h2>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inclus */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Inclus dans la livraison</h3>
                </div>
                <ul className="space-y-3">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Non inclus */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Non inclus</h3>
                </div>
                <ul className="space-y-3">
                  {NOT_INCLUDED.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0 text-xs font-bold">&times;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Notes */}
            <div className="max-w-4xl mx-auto mt-8 space-y-3">
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <Info className="w-5 h-5 text-[#4A90D9] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Les prix affichés sur le site sont HT et hors frais de livraison.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <Info className="w-5 h-5 text-[#4A90D9] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Les délais sont indicatifs et peuvent varier selon les conditions maritimes et portuaires.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-green-50 rounded-xl p-4 border border-green-100">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Assurance transport incluse dans tous nos envois.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5: CTA */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-[#4A90D9] to-[#3570b8] rounded-3xl p-10 md:p-14 shadow-2xl shadow-blue-900/30 border border-blue-400/30 text-center">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                Besoin d'un devis livraison ?
              </h2>
              <p className="text-blue-100 max-w-xl mx-auto mb-8 text-lg">
                Contactez-nous pour obtenir une estimation précise des frais de livraison adaptée à votre commande.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleWhatsApp}
                  className="h-14 px-10 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Demander un devis livraison
                </Button>
                <Link href="/minipelles">
                  <Button
                    variant="outline"
                    className="h-14 px-10 text-lg font-bold bg-white text-[#4A90D9] border-white hover:bg-white/90 rounded-xl shadow-lg flex items-center justify-center gap-2 w-full"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Voir notre catalogue
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
