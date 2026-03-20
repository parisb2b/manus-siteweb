/**
 * @deprecated Utiliser @/features/pdf directement.
 * Ce fichier est maintenu pour la rétrocompatibilité des imports existants.
 * Le générateur PDF est maintenant dans features/pdf/templates/invoice-pdf.ts
 */
export { generateFacturePDF, generateInvoicePDF } from "@/features/pdf/templates/invoice-pdf";
export type { FactureData, InvoiceData } from "@/features/pdf/templates/invoice-pdf";
