import { Link, useLocation } from "wouter";
import { Youtube, MessageCircle } from "lucide-react";
import TikTokIcon from "./TikTokIcon";
import { useSiteContent } from "@/hooks/useSiteContent";

export default function Footer() {
  const [location] = useLocation();
  const { content } = useSiteContent();

  // Logic to determine branding
  // Rippa branding is ONLY for /minipelles and /accessoires routes
  const isRippaPage = location.startsWith('/minipelles') || location.startsWith('/accessoires');

  const brandName = isRippaPage ? "Rippa DOM TOM" : "97 import";
  const brandDescription = isRippaPage
    ? "Rippa DOM TOM est votre partenaire de confiance pour les mini-pelles de haute qualité dans les DOM TOM. Performance, fiabilité et service local."
    : content?.siteSettings?.footerDescription || "97 import simplifie l'importation de produits de qualité (maisons, solaire, agricole) depuis la Chine vers les Antilles. Service clé en main.";

  // Use dedicated footer logos
  const logoSrc = isRippaPage
    ? "/images/logo_rippa_domtom_transparent.png"
    : "/images/logo_import97_footer_transparent.png";

  const whatsappNumber = content?.siteSettings?.whatsappNumber || "33663284908";
  const contactEmail = content?.siteSettings?.contactEmail || "import97@sasfr.com";
  const tiktokUrl = content?.siteSettings?.tiktokUrl || "https://www.tiktok.com/@direxport";

  return (
    <footer className="bg-[#4A90D9] text-white pt-16 pb-8 font-sans">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1 - Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
               <img
                 src={logoSrc}
                 alt={brandName}
                 className="h-16 w-auto object-contain"
               />
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              {brandDescription}
            </p>
            <div className="flex space-x-4">
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-200 transition-colors"><TikTokIcon className="h-5 w-5" /></a>
              <a href="#" className="text-white hover:text-blue-200 transition-colors"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 2 - Links */}
          <div>
            {/* Navigation Header Removed */}
            <ul className="space-y-3 text-sm text-blue-100 mt-0 md:mt-12">
              {content?.navigation?.menuItems?.filter(item => item.visible).map((item) => (
                <li key={item.path}><Link href={item.path} className="hover:text-white transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Legal */}
          <div>
            <h4 className="text-lg font-bold mb-6 uppercase tracking-wider text-white">Informations</h4>
            <ul className="space-y-3 text-sm text-blue-100">
              <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
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
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-green-700 transition-colors w-full rounded-lg"
              >
                <MessageCircle className="h-4 w-4" />
                Contact WhatsApp
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center justify-center bg-white text-[#4A90D9] font-bold uppercase tracking-wider px-6 py-3 text-sm hover:bg-blue-50 transition-colors w-full rounded-lg"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-900/50 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-blue-200">
          <div className="mb-4 md:mb-0">
            {content?.siteSettings?.footerText || `© ${new Date().getFullYear()} ${brandName}. Tous droits réservés.`}
          </div>
          <div className="flex items-center space-x-4">
            {/* Payment icons removed */}
          </div>
        </div>
      </div>
    </footer>
  );
}
