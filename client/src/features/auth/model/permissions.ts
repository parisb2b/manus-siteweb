/**
 * permissions.ts — Règles d'accès centralisées
 * SOURCE UNIQUE pour les décisions d'autorisation.
 *
 * Usage : import { canSeePrix, canAccessAdmin } from "@/features/auth/model/permissions"
 */

import type { Role } from "./roles";

/** L'utilisateur peut voir les prix (≠ visiteur) */
export const canSeePrix = (role: Role): boolean => role !== "visitor";

/** L'utilisateur peut accéder au back-office */
export const canAccessAdmin = (role: Role): boolean =>
  role === "admin" || role === "collaborateur";

/** L'utilisateur peut voir toutes les fonctions admin (pas collaborateur restreint) */
export const isFullAdmin = (role: Role): boolean => role === "admin";

/** L'utilisateur peut voir ses commissions partenaire */
export const isPartner = (role: Role): boolean => role === "partner";

/** L'utilisateur bénéficie d'un prix négocié */
export const hasNegotiatedPrice = (role: Role): boolean =>
  role === "vip" || role === "admin" || role === "collaborateur";

/** L'utilisateur voit le prix partenaire */
export const hasPartnerPrice = (role: Role): boolean =>
  role === "partner" || role === "admin" || role === "collaborateur";
