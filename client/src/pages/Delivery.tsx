import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Truck, MapPin, Package, Clock, Ship, FileCheck } from "lucide-react";

export default function Delivery() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[#4A90D9] mb-4">Livraison DOM-TOM</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nous simplifions l'importation de matériel lourd et de structures modulaires vers les Antilles, la Guyane, la Réunion et Mayotte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#4A90D9] mb-6">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#4A90D9] mb-3">1. Préparation & Fabrication</h3>
              <p className="text-gray-600">
                Selon le produit commandé et le stock disponible, la préparation peut prendre <strong>entre 2 et 30 jours</strong>. Vos marchandises sont ensuite soigneusement emballées et sécurisées.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#4A90D9] mb-6">
                <Ship className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#4A90D9] mb-3">2. Transport Maritime</h3>
              <p className="text-gray-600">
                Transport maritime <strong>entre 30 et 45 jours</strong>. Livraison depuis la Chine jusqu'à votre destination. Nous travaillons avec les meilleures compagnies maritimes (CMA CGM, Maersk, MSC).
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#4A90D9] mb-6">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#4A90D9] mb-3">3. Dédouanement</h3>
              <p className="text-gray-600 text-sm mb-2">
                À l'arrivée, les formalités sont gérées par notre transitaire. <strong>Le dédouanement (Octroi de Mer, TVA) est à la charge du client</strong> et doit être réglé directement à notre partenaire local agréé.
              </p>
              <p className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded inline-block">
                Possibilité de dossier de défiscalisation (tarif à part)
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#4A90D9] mb-6">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#4A90D9] mb-3">4. Livraison Finale</h3>
              <p className="text-gray-600">
                Récupération au port ou livraison sur votre chantier/terrain selon l'option choisie. Nous pouvons coordonner le transport final avec des partenaires locaux.
              </p>
            </div>
          </div>

          <div className="bg-[#4A90D9] rounded-3xl p-8 md:p-12 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-white">
                  <Clock className="w-6 h-6 text-yellow-400" /> Délais Moyens
                </h3>
                <ul className="space-y-4 text-blue-100">
                  <li className="flex justify-between border-b border-blue-800 pb-2">
                    <span>Guadeloupe / Martinique</span>
                    <span className="font-bold text-white">45 - 55 Jours</span>
                  </li>
                  <li className="flex justify-between border-b border-blue-800 pb-2">
                    <span>Guyane</span>
                    <span className="font-bold text-white">50 - 60 Jours</span>
                  </li>
                  <li className="flex justify-between border-b border-blue-800 pb-2">
                    <span>La Réunion</span>
                    <span className="font-bold text-white">35 - 45 Jours</span>
                  </li>
                  <li className="flex justify-between pb-2">
                    <span>Mayotte</span>
                    <span className="font-bold text-white">40 - 50 Jours</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-white">
                  <MapPin className="w-6 h-6 text-yellow-400" /> Ports Desservis
                </h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  Nous livrons dans les principaux ports des DOM-TOM : 
                  Pointe-à-Pitre, Fort-de-France, Dégrad des Cannes, Port Réunion (Pointe des Galets) et Longoni.
                </p>
                <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                  <p className="text-sm text-center italic">
                    "Une logistique maîtrisée pour que la distance ne soit plus un obstacle à vos projets."
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
