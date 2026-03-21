/**
 * pdf-helpers.ts — Utilitaires partagés pour la génération PDF
 */

/** Formate un nombre en euros — espaces ASCII standards (compatible jsPDF) */
export function formatPrix(n: number): string {
  if (n == null || isNaN(n)) return "0,00 \u20AC";
  const abs = Math.abs(n);
  const parts = abs.toFixed(2).split(".");
  const entier = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "-" : "") + entier + "," + parts[1] + " \u20AC";
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
