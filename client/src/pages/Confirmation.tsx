import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Confirmation() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl shadow-xl p-10 md:p-14 max-w-md w-full mx-4 text-center">

          {/* Icône succès */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-5 rounded-full">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Compte activé !
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-base leading-relaxed mb-8">
            Votre compte a été confirmé avec succès.
            Vous pouvez maintenant vous connecter et accéder à toutes les fonctionnalités.
          </p>

          {/* Bouton retour connexion */}
          <Link href="/">
            <Button className="bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold px-8 py-3 text-base w-full">
              Se connecter
            </Button>
          </Link>

        </div>
      </main>

      <Footer />
    </div>
  );
}
