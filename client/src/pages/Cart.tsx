import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Cart() {
  const { items, removeFromCart, clearCart } = useCart();

  const handleRequestQuote = () => {
    if (items.length === 0) return;

    // Build the message
    let message = "Bonjour, je souhaite obtenir un devis pour les articles suivants :\n\n";
    
    items.forEach((item) => {
      message += `- ${item.name} (x${item.quantity}) - ${item.price}\n`;
    });

    message += "\nMerci de me recontacter pour finaliser la commande et calculer les frais de transport.";

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp
    window.open(`https://wa.me/33663284908?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-serif font-bold text-[#1a1a5e] mb-8">Votre Panier</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-6">Votre panier est vide pour le moment.</p>
            <Link href="/">
              <Button className="btn-rippa">Découvrir nos produits</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                  <Link href={item.type === 'machine' ? `/products/${item.id}` : '/accessoires'} className="flex flex-col sm:flex-row items-center flex-grow cursor-pointer group">
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden mb-4 sm:mb-0 group-hover:opacity-80 transition-opacity">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="flex-grow sm:ml-6 text-center sm:text-left">
                      <h3 className="font-bold text-[#1a1a5e] group-hover:text-blue-700 transition-colors">{item.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                      <p className="text-[#1a1a5e] font-bold mt-1">{item.price}</p>
                    </div>
                  </Link>

                  <div className="flex items-center mt-4 sm:mt-0">
                    <span className="text-gray-600 mr-4">Qté: {item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center mt-8">
                 <Link href="/">
                  <Button variant="ghost" className="text-gray-600">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Continuer mes achats
                  </Button>
                </Link>
                <Button variant="outline" onClick={clearCart} className="text-red-500 border-red-200 hover:bg-red-50">
                  Vider le panier
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 sticky top-24">
                <h3 className="text-xl font-bold text-[#1a1a5e] mb-6">Récapitulatif</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nombre d'articles</span>
                    <span className="font-bold">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-bold text-[#1a1a5e]">Note sur le transport :</span><br/>
                      Les frais de transport sont variables selon la commande et la destination.
                    </p>
                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100">
                      Estimation : environ <strong>250€ / m³</strong>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full btn-rippa h-12 text-base flex items-center justify-center gap-2"
                  onClick={handleRequestQuote}
                >
                  <MessageCircle className="h-5 w-5" />
                  Demander un devis
                </Button>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                  Vous serez redirigé vers WhatsApp pour envoyer votre demande directement à notre équipe commerciale.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
