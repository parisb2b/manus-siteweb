/**
 * invoice-pdf.ts — Génération PDF facture (style minimaliste)
 * Utilise pdf-engine.ts — Zéro fond sombre
 */

import {
  createDocument,
  addPageHeader,
  addParties,
  addProductTable,
  addTotal,
  addTVAMention,
  addConditionsPage,
  addPageFooter,
} from "../lib/pdf-engine";
import { GREEN_ACC } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface InvoiceProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;
  quantite: number;
  total: number;
}

export interface InvoiceData {
  numeroFacture: string;
  dateFacture: string;
  dateDevis?: string;
  numeroDevis?: string;
  client: {
    nom: string;
    adresse: string;
    ville: string;
    pays: string;
    email: string;
    telephone?: string;
  };
  produits: InvoiceProduit[];
  totalHT: number;
}

/** Parse robuste des produits */
function parseProduits(raw: any): InvoiceProduit[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") {
        const p2 = JSON.parse(parsed);
        if (Array.isArray(p2)) return p2;
      }
    } catch { return []; }
  }
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.produits)) return raw.produits;
  }
  return [];
}

export function generateInvoicePDF(data: InvoiceData): Blob {
  const doc = createDocument();
  const produits = parseProduits(data.produits);

  // ── Page 1 ───────────────────────────────────────────────────────
  let y = addPageHeader(doc, {
    numeroDoc: data.numeroFacture,
    date: data.dateFacture,
    type: "facture",
    accent: GREEN_ACC,
    subtitle: data.numeroDevis ? `R\u00E9f. devis\u00A0: ${data.numeroDevis}` : undefined,
  });

  const clientLignes: string[] = [];
  if (data.client.adresse) clientLignes.push(data.client.adresse);
  if (data.client.ville) clientLignes.push(data.client.ville);
  if (data.client.pays) clientLignes.push(data.client.pays);
  clientLignes.push(`Email\u00A0: ${data.client.email}`);
  if (data.client.telephone) clientLignes.push(`T\u00E9l\u00A0: ${data.client.telephone}`);

  y = addParties(doc, { destinataire: { nom: data.client.nom, lignes: clientLignes } }, y);

  // Recalculer total depuis les items
  const totalReel = produits.reduce((s, p) => {
    const pu = Number((p as any).prixUnitaire ?? (p as any).prixAffiche ?? (p as any).prix ?? 0);
    const qty = Number((p as any).quantite ?? (p as any).qty ?? 1);
    return s + pu * qty;
  }, 0);

  y = addProductTable(
    doc,
    {
      columns: [
        { header: "D\u00E9signation", width: 52, bold: true },
        { header: "Description",     width: 50 },
        { header: "Prix HT",         width: 32, align: "right" },
        { header: "Qt\u00E9",        width: 14, align: "center" },
        { header: "Total HT",        width: 32, align: "right", bold: true },
      ],
      rows: produits.map((p) => {
        const nom = String((p as any).nom || (p as any).name || (p as any).designation || "—");
        const desc = String((p as any).description || "");
        const pu = Number((p as any).prixUnitaire ?? (p as any).prixAffiche ?? (p as any).prix ?? 0);
        const qty = Number((p as any).quantite ?? (p as any).qty ?? (p as any).quantity ?? 1);
        const total = pu * qty;
        return {
          cells: [
            nom,
            desc,
            formatPrix(pu),
            String(qty),
            formatPrix(total),
          ],
        };
      }),
    },
    y,
  );

  y = addTotal(doc, { montant: totalReel, accent: GREEN_ACC }, y);

  // Mention "Date de paiement"
  const W = doc.internal.pageSize.getWidth();
  const L = 15;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(L, y, W - L * 2, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GREEN_ACC);
  doc.text("Date de paiement\u00A0: \u00C0 r\u00E9ception de la pr\u00E9sente facture", L + 4, y + 6);
  y += 13;

  addTVAMention(doc, y);
  addPageFooter(doc, { numeroDoc: data.numeroFacture, page: 1, totalPages: 2 });

  // ── Page 2 ───────────────────────────────────────────────────────
  addConditionsPage(doc, {
    numeroDoc: data.numeroFacture,
    date: data.dateFacture,
    type: "facture",
    accent: GREEN_ACC,
    referenceDevis: data.numeroDevis,
  });

  return doc.output("blob");
}

// Ré-export pour rétro-compatibilité
export type { InvoiceData as FactureData };
export { generateInvoicePDF as generateFacturePDF };
