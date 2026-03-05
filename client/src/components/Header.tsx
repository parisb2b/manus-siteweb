import { Link, useLocation } from "wouter";
import { User, ShoppingBag, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [location] = useLocation();
  const { cartCount } = useCart();
  const { user, profile, signOut, setShowAuthModal } = useAuth();
  const { content } = useSiteContent();

  const isPreview = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");

  const isActive = (path: string) => location === path;

  const isRippaPage = location.startsWith('/minipelles') || location.startsWith('/accessoires');

  const logoSrc = isRippaPage
    ? "/images/logo_rippa_new.png"
    : "/images/logo_import97_large.png";

  const logoAlt = isRippaPage ? "Rippa DOM TOM" : "97 import";

  const handleUserClick = () => {
    if (user) {
      setShowUserMenu(!showUserMenu);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm font-sans">
      {isPreview && (
        <div className="bg-amber-400 text-black text-center py-2 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2">
          <span>⚠️</span> MODE APERÇU — Modifications non publiées <span>⚠️</span>
        </div>
      )}

      {/* Top Bar - Promotion */}
      <div className="bg-[#4A90D9] text-white text-center py-2 text-xs font-bold tracking-wider uppercase">
        {content?.siteSettings?.topBanner || "EXPÉDITION SOUS 45 JOURS DANS LES DOM TOM"}
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            <img src={logoSrc} alt={logoAlt} className="h-16 md:h-20 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {content?.navigation?.menuItems?.filter(item => item.visible).map((item) => (
              <Link key={item.path} href={item.path}>
                <span className={`nav-link ${isActive(item.path) ? 'text-[#4A90D9]' : ''}`}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="hidden lg:flex items-center space-x-6 text-gray-600">
            {/* Auth Button */}
            <div className="relative">
              <button
                onClick={handleUserClick}
                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                  user ? "text-[#4A90D9]" : "text-gray-600 hover:text-[#4A90D9]"
                }`}
              >
                <User className="h-5 w-5" />
                {user && profile ? (
                  <span className="hidden xl:inline text-xs">{profile.prenom}</span>
                ) : (
                  <span className="hidden xl:inline text-xs">Connexion</span>
                )}
              </button>

              {/* User dropdown */}
              {showUserMenu && user && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900">
                      {profile?.prenom} {profile?.nom}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>

            <Link href="/cart">
              <div className="relative cursor-pointer hover:text-[#4A90D9]">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#4A90D9] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
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
          {content?.navigation?.menuItems?.filter(item => item.visible).map((item) => (
            <Link key={item.path} href={item.path} onClick={() => setIsMenuOpen(false)}>
              <span className="block py-2 text-sm font-bold uppercase text-gray-800 hover:text-[#4A90D9]">{item.label}</span>
            </Link>
          ))}

          {/* Mobile Auth & Cart */}
          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#4A90D9]">
                  {profile?.prenom} {profile?.nom}
                </span>
                <button
                  onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                  className="text-sm text-red-600 font-bold"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setIsMenuOpen(false); }}
                className="flex items-center gap-2 py-2 text-sm font-bold uppercase text-[#4A90D9]"
              >
                <User className="h-5 w-5" />
Se connecter
              </button>
            )}
            <div className="flex items-center space-x-6 text-gray-600">
              <Link href="/cart" onClick={() => setIsMenuOpen(false)}>
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#4A90D9] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </header>
  );
}
