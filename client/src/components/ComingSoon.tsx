import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl max-w-2xl w-full border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Construction className="h-12 w-12 text-[#4A90D9]" />
          </div>
          <h1 className="text-4xl font-bold text-[#4A90D9] mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {description}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button className="bg-[#4A90D9] hover:bg-[#3A7BC8] text-white px-8 py-6 text-lg rounded-xl">
                Retour à l'accueil
              </Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" className="border-[#4A90D9] text-[#4A90D9] hover:bg-blue-50 px-8 py-6 text-lg rounded-xl">
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
