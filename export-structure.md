# Export Structure — 97import.com
> Généré le : 2026-03-20 | Branche : main | Commit : 61b812c

---

## 1. ARBORESCENCE COMPLÈTE src/

```
client/src/
├── App.tsx
├── const.ts
├── index.css
├── main.tsx
├── components/
│   ├── AuthModal.tsx
│   ├── CartNotification.tsx
│   ├── ComingSoon.tsx
│   ├── CookieConsent.tsx
│   ├── DeliveryEstimator.tsx
│   ├── DevisForm.tsx            ← formulaire devis PDF
│   ├── ErrorBoundary.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── ManusDialog.tsx
│   ├── Map.tsx
│   ├── PrixOuDevis.tsx          ← affichage prix selon rôle
│   ├── ProductCard.tsx
│   ├── SEO.tsx
│   ├── ScrollToTop.tsx
│   ├── TikTokIcon.tsx
│   └── ui/ (composants shadcn/ui — accordion, alert, badge, button, card, dialog, input, select, tabs, etc.)
├── contexts/
│   ├── AuthContext.tsx           ← auth Supabase + rôles
│   ├── CartContext.tsx
│   ├── LanguageContext.tsx
│   └── ThemeContext.tsx
├── data/
│   ├── analytics.json
│   ├── products.json            ← fallback JSON produits
│   ├── settings.json
│   ├── site-content.json        ← fallback JSON CMS
│   └── translations.json
├── hooks/
│   ├── useComposition.ts
│   ├── useContactForm.ts
│   ├── useMobile.tsx
│   ├── usePersistFn.ts
│   ├── useProducts.ts           ← Supabase-first + fallback JSON
│   ├── useRole.ts               ← wraps AuthContext
│   └── useSiteContent.ts        ← Supabase-first + fallback JSON
├── lib/
│   ├── analytics.ts
│   ├── api.ts                   ← helpers fetch (fallback JSON)
│   ├── supabase.ts              ← client Supabase
│   └── utils.ts
├── pages/
│   ├── About.tsx
│   ├── Accessories.tsx
│   ├── Agriculture.tsx
│   ├── AuthCallback.tsx
│   ├── CampingCarDeluxe.tsx
│   ├── Cart.tsx                 ← panier + DevisForm modal
│   ├── Confirmation.tsx
│   ├── Connexion.tsx            ← page /connexion full-page auth
│   ├── Contact.tsx
│   ├── Delivery.tsx
│   ├── ForgotPassword.tsx
│   ├── Legal.tsx
│   ├── MiniPelles.tsx
│   ├── ModularHomes.tsx
│   ├── ModularPremium.tsx
│   ├── ModularStandard.tsx
│   ├── MonCompte.tsx            ← espace client (devis + commissions)
│   ├── NotFound.tsx
│   ├── PortalHome.tsx
│   ├── Privacy.tsx
│   ├── ProductDetail.tsx
│   ├── ResetPassword.tsx
│   ├── Services.tsx
│   ├── Solar.tsx
│   ├── SolarKitDetail.tsx
│   ├── SolarPanels.tsx
│   ├── Terms.tsx
│   └── admin/
│       ├── AdminAnalytics.tsx
│       ├── AdminDashboard.tsx
│       ├── AdminHeaderFooter.tsx
│       ├── AdminLayout.tsx       ← sidebar + auth guard + publish button
│       ├── AdminLeads.tsx
│       ├── AdminLogin.tsx        ← Supabase auth (admin/collaborateur)
│       ├── AdminMedia.tsx
│       ├── AdminNavigation.tsx
│       ├── AdminPages.tsx
│       ├── AdminPartners.tsx     ← gestion partenaires + commissions
│       ├── AdminPricing.tsx
│       ├── AdminProducts.tsx
│       ├── AdminQuotes.tsx       ← devis + partenaire + VIP + commission PDF
│       ├── AdminSettings.tsx
│       ├── AdminShipping.tsx
│       └── AdminUsers.tsx        ← gestion utilisateurs Supabase
└── utils/
    ├── calculPrix.ts             ← logique prix par rôle
    ├── generateCommissionPDF.ts  ← PDF note de commission (orange)
    ├── generateDevisPDF.ts       ← PDF devis 2 pages (bleu/sombre)
    └── generateFacturePDF.ts     ← PDF facture (vert)
```

---

## 2. CONFIGURATION

### vercel.json
```json
{
  "installCommand": "pnpm install",
  "buildCommand": "vite build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

### Dépendances clés (package.json)
```
React 19, Vite 7, TypeScript 5.6
@supabase/supabase-js ^2.98
jspdf ^4.2.1 + jspdf-autotable ^5.0.7
wouter ^3.3.5 (routing SPA)
recharts ^2.15.2 (analytics)
lucide-react ^0.453
tailwindcss ^4.1 + @tailwindcss/vite
framer-motion ^12
zod ^4.1
```

---

## 3. SCHÉMA BASE DE DONNÉES SUPABASE

### Table: profiles
```
id          UUID (FK auth.users)
first_name  TEXT
last_name   TEXT
email       TEXT
phone       TEXT
role        TEXT  — 'visitor'|'user'|'vip'|'partner'|'collaborateur'|'admin'
prix_negocie JSONB — { default: number, productId: number, ... }
created_at  TIMESTAMPTZ
```

### Table: quotes
```
id                UUID PK
user_id           UUID FK profiles.id
email             TEXT
nom               TEXT
telephone         TEXT
message           TEXT
produits          JSONB  — Array<{ id, nom, quantite, prixAffiche, prixUnitaire, prixAchat, prixPublic }>
prix_total_calcule DECIMAL
prix_negocie      DECIMAL
role_client       TEXT
statut            TEXT  — 'nouveau'|'en_cours'|'negociation'|'accepte'|'refuse'
notes_admin       TEXT
numero_devis      TEXT UNIQUE  — ex: D2600001
pdf_url           TEXT
facture_url       TEXT
facture_generee   BOOLEAN
adresse_client    TEXT
ville_client      TEXT
pays_client       TEXT DEFAULT 'France'
signature_client  TEXT
signe_le          TIMESTAMPTZ
partner_id        UUID FK partners.id
commission_montant DECIMAL(10,2)
commission_payee  BOOLEAN DEFAULT false
commission_pdf_url TEXT
created_at        TIMESTAMPTZ
```

### Table: partners
```
id          UUID PK (00000000-0000-0000-0000-000000000001 = ADMINISTRATEUR)
nom         TEXT
email       TEXT
telephone   TEXT
user_id     UUID FK profiles.id
actif       BOOLEAN DEFAULT true
created_at  TIMESTAMPTZ
```

### Table: products
```
id          UUID PK
nom         TEXT
reference   TEXT UNIQUE
categorie   TEXT
description TEXT
prix_achat  DECIMAL
actif       BOOLEAN DEFAULT true
data        JSONB  — champs étendus (gallery, specs, options, etc.)
created_at  TIMESTAMPTZ
```

### Table: site_content
```
key         TEXT PK  — ex: 'site_content', 'house_prices'
value       JSONB
updated_at  TIMESTAMPTZ
```

### Séquences & Fonctions SQL
```sql
CREATE SEQUENCE IF NOT EXISTS devis_numero_seq START 1;

CREATE OR REPLACE FUNCTION get_next_devis_numero() RETURNS TEXT AS $$
DECLARE next_val INTEGER; annee TEXT;
BEGIN
  next_val := nextval('devis_numero_seq');
  annee := to_char(NOW(), 'YY');
  RETURN 'D' || annee || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. LOGIQUE MÉTIER CLÉE

### calculPrix.ts — Prix par rôle
```
visitor     → null (bouton rouge "Se connecter")
user        → prix_achat × 1.5  (bleu)
partner     → prix_achat × 1.2  (orange)
vip         → prix_negocie ?? prix_achat × 1.3  (violet)
admin/coll. → prix_achat + prix_public + prix_partenaire affichés
```

### Commission partenaire
```
commission = prix_negocie - (prix_achat × 1.2)
           = prix_negocie - prix_partenaire
Note: prix_achat ≈ prix_total_calcule (public) / 1.5
```

### Numérotation
```
Devis    : D + YY + 00001  (ex: D2600001) — via SQL séquence serveur
Facture  : F + YY + 00001  (remplacement D→F du numéro devis)
Commission: C + numéro devis sans D (ex: C2600001)
```

---

## 5. STYLE PDF ACTUEL (à redessiner en minimaliste)

### generateDevisPDF.ts
- Header : fond `#1A1A2E` (dark navy) + titre blanc + "97import.com" en `#4A90D9`
- Tableau : en-têtes `#4A90D9`, lignes alternées gris clair
- Total : fond `#1A1A2E` + texte blanc
- Page 2 : Conditions + "Bon pour accord" (cadre bleu)
- VIP : prix barré gris + prix négocié bleu

### generateFacturePDF.ts
- Même structure mais header vert `#109648`
- Total fond vert

### generateCommissionPDF.ts
- Header fond `#1A1A2E` + titre orange `#EA580C`
- Tableau en-têtes orange
- Total fond orange

### Style demandé (Priorité 2)
- Tout blanc, zéro fond sombre
- Texte bleu marine `#1E3A5F`
- Lignes tableau : bordure bleu clair `#BFDBFE`
- En-têtes : texte bleu marine + fond blanc + bordure bleue
- Total : encadré blanc avec bordure bleue marine, texte bleu marine gras
- Polices helvetica uniquement

---

## 6. POINTS D'ATTENTION POUR GEMINI

1. **AdminUsers** charge depuis `profiles` table uniquement → Les comptes Google créés AVANT le trigger Auth ne sont pas dans profiles → SQL de sync nécessaire
2. **useProducts** : essaie Supabase d'abord (table `products`), mais le mapping Supabase→Product interface est partiel (champs étendus dans `data` JSONB)
3. **useSiteContent** : essaie Supabase d'abord (table `site_content`, key="site_content"), sinon JSON local
4. **Pas de backend API** sur Vercel — tout passe par Supabase client JS directement
5. **`/api/` calls restants** dans `AdminProducts.tsx` (JSON editor), `AdminMedia.tsx`, `AdminLayout.tsx` (publish/git) — dev-only, ne cassent pas la prod Vercel grâce aux fallbacks
6. **pnpm-lock.yaml** présent → Vercel utilise pnpm automatiquement
7. **wouter** (pas React Router) — SPA routing, rewrites Vercel configurés
