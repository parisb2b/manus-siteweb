import { Link, useLocation } from "wouter";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { cartCount } = useCart();

  const isActive = (path: string) => location === path;

  // Logic to determine which logo to show
  // Default is Import97 logo
  // Rippa logo is ONLY for /minipelles and /accessoires routes (and their sub-routes if any)
  const isRippaPage = location.startsWith('/minipelles') || location.startsWith('/accessoires');
  
  // Updated to use the new larger logo files
  const logoSrc = isRippaPage 
    ? "/images/logo_rippa_new.png" 
    : "/images/logo_import97_large.png";

  const logoAlt = isRippaPage ? "Rippa DOM TOM" : "Import 97";

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm font-sans">
      {/* Top Bar - Promotion */}
      <div className="bg-[#1a1a5e] text-white text-center py-2 text-xs font-bold tracking-wider uppercase">
        Expédition sous 45 jours dans les DOM TOM
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Increased height for better visibility */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <img src={logoSrc} alt={logoAlt} className="h-16 md:h-20 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/">
              <span className={`nav-link ${isActive('/') ? 'text-[#1a1a5e]' : ''}`}>Accueil</span>
            </Link>
            <Link href="/minipelles">
              <span className={`nav-link ${isActive('/minipelles') ? 'text-[#1a1a5e]' : ''}`}>Mini-pelles</span>
            </Link>
            <Link href="/accessoires">
              <span className={`nav-link ${isActive('/accessoires') ? 'text-[#1a1a5e]' : ''}`}>Accessoires</span>
            </Link>
            <Link href="/maisons">
              <span className={`nav-link ${isActive('/maisons') ? 'text-[#1a1a5e]' : ''}`}>Maisons</span>
            </Link>
            <Link href="/solaire">
              <span className={`nav-link ${isActive('/solaire') ? 'text-[#1a1a5e]' : ''}`}>Solaire</span>
            </Link>
            <Link href="/agricole">
              <span className={`nav-link ${isActive('/agricole') ? 'text-[#1a1a5e]' : ''}`}>Agricole</span>
            </Link>
            <Link href="/services">
              <span className={`nav-link ${isActive('/services') ? 'text-[#1a1a5e]' : ''}`}>Services</span>
            </Link>
          </nav>

          {/* Icons */}
          <div className="hidden lg:flex items-center space-x-6 text-gray-600">
            <div className="flex items-center space-x-1 text-xs font-bold uppercase cursor-pointer hover:text-[#1a1a5e]">
              <span>Français</span>
              <span className="text-[10px]">▼</span>
            </div>
            <Search className="h-5 w-5 cursor-pointer hover:text-[#1a1a5e]" />
            <User className="h-5 w-5 cursor-pointer hover:text-[#1a1a5e]" />
            <Link href="/cart">
              <div className="relative cursor-pointer hover:text-[#1a1a5e]">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1a1a5e] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-lg py-4 px-4 flex flex-col space-y-4">
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Accueil</span>
          </Link>
          <Link href="/minipelles" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Mini-pelles</span>
          </Link>
          <Link href="/accessoires" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Accessoires</span>
          </Link>
          <Link href="/maisons" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Maisons Modulaires</span>
          </Link>
          <Link href="/solaire" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Panneaux Solaires</span>
          </Link>
          <Link href="/agricole" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Machines Agricoles</span>
          </Link>
          <Link href="/services" onClick={() => setIsMenuOpen(false)}>
            <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#1a1a5e]">Services</span>
          </Link>
          <div className="pt-4 border-t border-gray-100 flex items-center space-x-6 text-gray-600">
            <Search className="h-5 w-5" />
            <User className="h-5 w-5" />
            <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#1a1a5e] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
