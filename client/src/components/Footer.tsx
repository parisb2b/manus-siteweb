import { Link, useLocation } from "wouter";
import { Youtube } from "lucide-react";
import TikTokIcon from "./TikTokIcon";

export default function Footer() {
  const [location] = useLocation();

  // Logic to determine branding
  // Rippa branding is ONLY for /minipelles and /accessoires routes
  const isRippaPage = location.startsWith('/minipelles') || location.startsWith('/accessoires');

  const brandName = isRippaPage ? "Rippa DOM TOM" : "Import 97";
  const brandDescription = isRippaPage 
    ? "Rippa DOM TOM est votre partenaire de confiance pour les mini-pelles de haute qualité dans les DOM TOM. Performance, fiabilité et service local."
    : "Import 97 simplifie l'importation de produits de qualité (maisons, solaire, agricole) depuis la Chine vers les Antilles. Service clé en main.";

  // Use the new logos
  const logoSrc = isRippaPage 
    ? "/images/rippa-dom-tom-white.png" 
    : "/images/logo/logo_import97_footer.png";

  return (
    <footer className="bg-[#1a1a5e] text-white pt-16 pb-8 font-sans">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1 - Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
               <img 
                 src={logoSrc} 
                 alt={brandName} 
                 className={`h-16 w-auto object-contain`} 
               />
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              {brandDescription}
            </p>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@direxport" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-200 transition-colors"><TikTokIcon className="h-5 w-5" /></a>
              <a href="#" className="text-white hover:text-blue-200 transition-colors"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 2 - Links */}
          <div>
            {/* Navigation Header Removed */}
            <ul className="space-y-3 text-sm text-blue-100 mt-0 md:mt-12">
              <li><Link href="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link href="/minipelles" className="hover:text-white transition-colors">Mini-pelles</Link></li>
              <li><Link href="/accessoires" className="hover:text-white transition-colors">Accessoires</Link></li>
              <li><Link href="/maisons" className="hover:text-white transition-colors">Maisons Modulaires</Link></li>
              <li><Link href="/solaire" className="hover:text-white transition-colors">Panneaux Solaires</Link></li>
              <li><Link href="/agricole" className="hover:text-white transition-colors">Machines Agricoles</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">SAV & Contact</Link></li>
            </ul>
          </div>

          {/* Column 3 - Legal */}
          <div>
            <h4 className="text-lg font-bold mb-6 uppercase tracking-wider text-white">Informations</h4>
            <ul className="space-y-3 text-sm text-blue-100">
              <li><Link href="/terms" className="hover:text-white transition-colors">Conditions Générales de Vente</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Politique de Confidentialité</Link></li>
              <li><Link href="/delivery" className="hover:text-white transition-colors">Livraison DOM TOM</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">Mentions Légales</Link></li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 uppercase tracking-wider text-white">Contact</h4>
            <p className="text-blue-100 text-sm mb-4">
              Une question ? Notre équipe est à votre disposition.
            </p>
            <div className="flex flex-col gap-3">
              <a 
                href="https://wa.me/33663284908" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-green-600 text-white font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-green-700 transition-colors w-full"
              >
                Contact WhatsApp
              </a>
              <a 
                href="mailto:import97@sasfr.com" 
                className="inline-flex items-center justify-center bg-white text-[#1a1a5e] font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-blue-50 transition-colors w-full"
              >
                import97@sasfr.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-900/50 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-blue-200">
          <div className="mb-4 md:mb-0">
            © {new Date().getFullYear()} {brandName}. Tous droits réservés.
          </div>
          <div className="flex items-center space-x-4">
            {/* Payment icons removed */}
          </div>
        </div>
      </div>
    </footer>
  );
}
