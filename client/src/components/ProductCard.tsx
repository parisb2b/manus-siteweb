import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price?: string;
  /** Overrides price display — pass <PrixOuDevis /> for role-aware rendering */
  priceElement?: ReactNode;
  image: string;
  isSoldOut?: boolean;
  link: string;
  reference_interne?: string;
}

export default function ProductCard({ id, name, price, priceElement, image, isSoldOut, link, reference_interne }: ProductCardProps) {
  return (
    <div className="group flex flex-col h-full bg-white rounded-2xl hover:shadow-xl transition-shadow duration-300 border border-transparent hover:border-gray-100 overflow-hidden">
      {/* Image Container */}
      <Link href={link}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 flex items-center justify-center p-6 cursor-pointer">
          {isSoldOut && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider z-10">
              Épuisé
            </div>
          )}
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6 text-center">
        <Link href={link}>
          <h3 className="text-2xl font-serif font-bold text-[#4A90D9] mb-2 cursor-pointer hover:text-primary/80 transition-colors">
            {name}
          </h3>
        </Link>
        <div className="text-lg font-bold text-gray-900 mb-6">
          {priceElement ?? price}
        </div>
        {reference_interne && (
          <span style={{
            fontSize: '10px',
            color: '#D1D5DB',
            display: 'block',
            marginTop: '4px',
            fontFamily: 'Inter, sans-serif',
          }}>
            Réf. {reference_interne}
          </span>
        )}
        
        <div className="mt-auto">
          <Link href={link}>
            <Button className="w-full btn-rippa group-hover:bg-[#4A90D9] group-hover:text-white">
              Voir le produit
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
