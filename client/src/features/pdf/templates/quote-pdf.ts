/**
 * quote-pdf.ts — Génération PDF devis (style minimaliste)
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
  drawVipPriceCell,
} from "../lib/pdf-engine";
import { NAVY, BLUE } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface QuoteProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;   // prix client (selon son rôle)
  prixPublic?: number;    // prix référence ×1.5 (barré pour VIP)
  remise?: number;        // % de remise
  quantite: number;
  total: number;
}

export interface QuoteData {
  numeroDevis: string;
  date: string;
  client: {
    nom: string;
    adresse: string;
    ville: string;
    pays: string;
    email: string;
    telephone?: string;
  };
  produits: QuoteProduit[];
  totalHT: number;
  role: string;
}

export function generateQuotePDF(data: QuoteData): Blob {
  const doc = createDocument();
  const isVip = data.role === "vip";

  // ── Page 1 ───────────────────────────────────────────────────────
  let y = addPageHeader(doc, {
    numeroDoc: data.numeroDevis,
    date: data.date,
    type: "devis",
    accent: NAVY,
  });

  const clientLignes: string[] = [];
  if (data.client.adresse) clientLignes.push(data.client.adresse);
  if (data.client.ville) clientLignes.push(data.client.ville);
  if (data.client.pays) clientLignes.push(data.client.pays);
  clientLignes.push(`Email\u00A0: ${data.client.email}`);
  if (data.client.telephone) clientLignes.push(`T\u00E9l\u00A0: ${data.client.telephone}`);

  y = addParties(doc, { destinataire: { nom: data.client.nom, lignes: clientLignes } }, y);

  // Tableau produits
  const totalReel = data.produits.reduce((s, p) => s + p.total, 0);

  const customDrawMap: Record<number, (doc: any, hookData: any) => void> = {};
  if (isVip) {
    data.produits.forEach((p, i) => {
      const prixRef = p.prixPublic ?? p.prixUnitaire;
      customDrawMap[i] = (docRef, hookData) => {
        drawVipPriceCell(docRef, hookData, {
          prixPublic: prixRef,
          prixNegocie: p.prixUnitaire,
          remise: p.remise,
        });
      };
    });
  }

  y = addProductTable(
    doc,
    {
      columns: [
        { header: "D\u00E9signation", width: 50, bold: true },
        { header: "Description",     width: 56 },
        { header: "Prix HT",         width: 34, align: "right" },
        { header: "Qt\u00E9",        width: 12, align: "center" },
        { header: "Total HT",        width: 30, align: "right", bold: true },
      ],
      rows: data.produits.map((p) => ({
        cells: [
          p.nom,
          p.description || "",
          isVip ? "" : formatPrix(p.prixUnitaire),
          String(p.quantite),
          formatPrix(p.total),
        ],
      })),
      customColumnIndex: isVip ? 2 : undefined,
      customDrawMap: isVip ? customDrawMap : undefined,
    },
    y,
  );

  y = addTotal(doc, { montant: totalReel, accent: NAVY }, y);
  addTVAMention(doc, y);
  addPageFooter(doc, { numeroDoc: data.numeroDevis, page: 1, totalPages: 2 });

  // ── Page 2 ───────────────────────────────────────────────────────
  addConditionsPage(doc, {
    numeroDoc: data.numeroDevis,
    date: data.date,
    type: "devis",
    accent: NAVY,
    showBonPourAccord: true,
  });

  return doc.output("blob");
}

// Ré-export des types pour rétro-compatibilité
export type { QuoteData as DevisData };
export { generateQuotePDF as generateDevisPDF };
