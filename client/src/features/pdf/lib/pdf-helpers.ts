/**
 * pdf-helpers.ts — Utilitaires partagés pour la génération PDF
 */

/** Formate un nombre en euros sans espaces insécables (compatible jsPDF) */
export function formatPrix(n: number): string {
  const abs = Math.abs(n);
  const entier = Math.floor(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
  const cents = Math.round((abs % 1) * 100).toString().padStart(2, "0");
  return (n < 0 ? "-" : "") + entier + "," + cents + "\u00A0\u20AC";
}

/** Formate une date ISO en date française */
export function formatDate(isoOrDate?: string | Date): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Coordonnées LUXENT LIMITED (émetteur constant) */
export const EMETTEUR = {
  nom: "LUXENT LIMITED",
  lignes: [
    "2ND FLOOR COLLEGE HOUSE",
    "17 KING EDWARDS ROAD RUISLIP",
    "HA4 7AE LONDON, Royaume-Uni",
    "N\u00B0 entreprise\u00A0: 14852122",
    "Email\u00A0: luxent@ltd-uk.eu",
  ],
};
