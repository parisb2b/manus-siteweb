import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const showCartNotification = (productName: string) => {
  toast.custom((t) => (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 w-full max-w-md pointer-events-auto flex flex-col gap-4 animate-in slide-in-from-top-5 duration-300">
      <div className="flex items-start gap-4">
        <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-[#4A90D9] text-lg">Produit ajouté !</h3>
          <p className="text-gray-600 text-sm mt-1">
            <span className="font-semibold">{productName}</span> a été ajouté à votre panier avec succès.
          </p>
        </div>
      </div>
      
      <div className="flex gap-3 mt-2">
        <button 
          onClick={() => toast.dismiss(t)}
          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm transition-colors"
        >
          Continuer mes achats
        </button>
        <Link href="/cart">
          <button 
            onClick={() => toast.dismiss(t)}
            className="flex-1 px-4 py-2.5 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Voir mon panier
          </button>
        </Link>
      </div>
    </div>
  ), {
    duration: 5000,
    position: 'top-center',
  });
};
