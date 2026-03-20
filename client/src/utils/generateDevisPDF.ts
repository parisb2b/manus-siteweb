/**
 * @deprecated Utiliser @/features/pdf directement.
 * Ce fichier est maintenu pour la rétrocompatibilité des imports existants.
 * Le générateur PDF est maintenant dans features/pdf/templates/quote-pdf.ts
 */
export { generateDevisPDF, generateQuotePDF } from "@/features/pdf/templates/quote-pdf";
export type { DevisData, QuoteData, QuoteProduit } from "@/features/pdf/templates/quote-pdf";
