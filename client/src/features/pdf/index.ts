/**
 * features/pdf/index.ts — Point d'entrée public du module PDF
 * Exporter tout ce dont les composants ont besoin
 */
export { generateQuotePDF, generateDevisPDF } from "./templates/quote-pdf";
export type { QuoteData, DevisData, QuoteProduit } from "./templates/quote-pdf";

export { generateInvoicePDF, generateFacturePDF } from "./templates/invoice-pdf";
export type { InvoiceData, FactureData } from "./templates/invoice-pdf";

export { generateCommissionPDF } from "./templates/commission-pdf";
export type { CommissionData } from "./templates/commission-pdf";
