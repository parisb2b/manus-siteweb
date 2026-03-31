/**
 * pricing.ts — Logique de calcul des prix
 * SOURCE UNIQUE de vérité pour les calculs de prix.
 *
 * Re-exporte calculerPrix depuis utils/calculPrix.ts (source réelle)
 * pour usage via @/features/pricing/model/pricing
 *
 * Règles métier :
 *   visitor     → null (bouton rouge "Se connecter")
 *   user        → prixAchat × 2
 *   partner     → prixAchat × 1.2
 *   vip         → prixNegocie ?? prixAchat × 1.3
 *   admin/coll. → prixAchat + niveaux affichés
 */

export {
  calculerPrix,
  formatEur,
  type PrixResult,
  type Role,
} from "@/utils/calculPrix";

/** Multiplicateurs par rôle — référence centralisée */
export const PRICE_MULTIPLIERS = {
  user:    2,
  partner: 1.2,
  vip:     1.3,  // fallback si pas de prix_negocie
} as const;

/**
 * Calcule le prix public (×2) depuis un prix d'achat.
 * Équivalent de calculerPrix(prixAchat, "user").prixAffiche
 */
export function prixPublic(prixAchat: number): number {
  return Math.round(prixAchat * PRICE_MULTIPLIERS.user);
}

/**
 * Calcule le prix partenaire (×1.2) depuis un prix d'achat.
 */
export function prixPartenaire(prixAchat: number): number {
  return Math.round(prixAchat * PRICE_MULTIPLIERS.partner);
}

/**
 * Calcule la commission partenaire.
 * commission = prixNegocie - prixPartenaire
 */
export function calcCommission(prixNegocie: number, prixAchatBrut: number): number {
  return Math.max(0, Math.round(prixNegocie - prixPartenaire(prixAchatBrut)));
}
