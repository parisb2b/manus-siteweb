import { useEffect } from "react";
import { useLocation } from "wouter";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "97 import - Importation depuis la Chine vers les DOM-TOM",
    description: "97 import simplifie l'importation de produits de qualité (mini-pelles, maisons modulaires, panneaux solaires, machines agricoles) depuis la Chine vers la Martinique, Guadeloupe, Guyane, Réunion et Mayotte.",
  },
  "/minipelles": {
    title: "Mini-pelles Série Pro | 97 import - Importation DOM-TOM",
    description: "Découvrez notre gamme de mini-pelles Rippa : R18 PRO, R22 PRO, R32 PRO, R57 PRO. Machines performantes livrées dans les DOM-TOM. Prix compétitifs, garantie constructeur.",
  },
  "/maisons": {
    title: "Maisons Modulaires | 97 import - DOM-TOM",
    description: "Maisons modulaires, studios et camping-cars tout confort. Solutions d'habitat clé en main livrées en Martinique, Guadeloupe, Guyane, Réunion et Mayotte.",
  },
  "/solaire": {
    title: "Panneaux Solaires | 97 import - Énergie DOM-TOM",
    description: "Solutions photovoltaïques pour l'autonomie énergétique dans les DOM-TOM. Panneaux solaires de qualité importés directement d'usine.",
  },
  "/agricole": {
    title: "Machines Agricoles | 97 import - DOM-TOM",
    description: "Tracteurs, compacteurs et équipements professionnels pour l'agriculture dans les DOM-TOM. Importation directe, prix compétitifs.",
  },
  "/accessoires": {
    title: "Accessoires Mini-pelles | 97 import",
    description: "Godets, marteaux, tarières et accessoires pour mini-pelles Rippa. Compatible R22 PRO, R32 PRO, R57 PRO. Livraison DOM-TOM.",
  },
  "/contact": {
    title: "Contactez-nous | 97 import",
    description: "Contactez l'équipe 97 import pour vos projets d'importation vers les DOM-TOM. WhatsApp, email, formulaire de contact.",
  },
  "/about": {
    title: "À propos | 97 import - Importation DOM-TOM",
    description: "Découvrez 97 import, spécialiste de l'importation de produits de qualité depuis la Chine vers les DOM-TOM. Nos valeurs, notre mission, nos engagements.",
  },
  "/cart": {
    title: "Votre Panier | 97 import",
    description: "Consultez votre panier et demandez un devis personnalisé pour vos produits 97 import.",
  },
  "/terms": {
    title: "Conditions Générales de Vente | 97 import",
    description: "Consultez les conditions générales de vente de 97 import : tarifs, paiement, livraison, garanties, SAV.",
  },
  "/privacy": {
    title: "Politique de Confidentialité | 97 import",
    description: "Politique de confidentialité et protection des données personnelles de 97 import. Conforme RGPD.",
  },
  "/legal": {
    title: "Mentions Légales | 97 import",
    description: "Mentions légales du site 97 import : informations sur l'entreprise, hébergeur, directeur de la publication.",
  },
  "/delivery": {
    title: "Livraison DOM-TOM | 97 import",
    description: "Informations sur la livraison vers les DOM-TOM : délais, ports desservis, dédouanement, transport maritime sécurisé.",
  },
};

export default function SEO({ title, description, image }: SEOProps) {
  const [location] = useLocation();

  useEffect(() => {
    const meta = PAGE_META[location] || {
      title: "97 import - Importation DOM-TOM",
      description: "97 import simplifie l'importation de produits de qualité depuis la Chine vers les DOM-TOM.",
    };

    const pageTitle = title || meta.title;
    const pageDescription = description || meta.description;
    const pageImage = image || "/images/logo_import97_large.png";

    // Set document title
    document.title = pageTitle;

    // Helper to set or create meta tag
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    setMeta("name", "description", pageDescription);
    setMeta("name", "robots", "index, follow");

    // Open Graph
    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", pageDescription);
    setMeta("property", "og:image", pageImage);
    setMeta("property", "og:type", "website");

    // Twitter Card
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", pageDescription);
    setMeta("name", "twitter:image", pageImage);
  }, [location, title, description, image]);

  return null;
}
