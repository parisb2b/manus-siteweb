/**
 * quote-pdf.ts — Génération PDF devis (style minimaliste)
 * Appel autoTable DIRECT — contourne addProductTable pour fiabilité
 */

import autoTable from "jspdf-autotable";
import {
  createDocument,
  addPageHeader,
  addParties,
  addTotal,
  addTVAMention,
  addConditionsPage,
  addPageFooter,
} from "../lib/pdf-engine";
import { NAVY, BLUE, LIGHT_BLUE, WHITE, STRIKE } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface QuoteProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;
  prixPublic?: number;
  remise?: number;
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

/** Parse robuste — gère Array, string JSON, double stringify, objet */
function parseProduits(raw: any): Array<{
  nom: string;
  description: string;
  prixUnitaire: number;
  quantite: number;
  prixPublic?: number;
  remise?: number;
}> {
  let arr: any[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    try {
      let parsed = JSON.parse(raw);
      while (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      return [];
    }
  } else if (raw && typeof raw === "object") {
    if (Array.isArray(raw.items)) arr = raw.items;
    else if (Array.isArray(raw.produits)) arr = raw.produits;
  }
  return arr.map((i: any) => ({
    nom: String(i.nom ?? i.name ?? i.designation ?? "Produit"),
    description: String(i.description ?? ""),
    prixUnitaire: Number(i.prixUnitaire ?? i.prixAffiche ?? i.prix ?? 0),
    quantite: Number(i.quantite ?? i.qty ?? i.quantity ?? 1),
    prixPublic: i.prixPublic != null ? Number(i.prixPublic) : undefined,
    remise: i.remise != null ? Number(i.remise) : undefined,
  }));
}

export function generateQuotePDF(data: QuoteData): Blob {
  const doc = createDocument();
  const isVip = data.role === "vip";
  const produits = parseProduits(data.produits);

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

  // ── Tableau produits — appel autoTable DIRECT ────────────────────
  const body: string[][] = [];
  const totalHT = produits.reduce(
    (sum, p) => sum + p.prixUnitaire * p.quantite,
    0,
  );

  if (isVip) {
    // VIP : 7 colonnes — avec prix public et remise
    for (let idx = 0; idx < produits.length; idx++) {
      const p = produits[idx];
      const total = p.prixUnitaire * p.quantite;
      body.push([
        p.nom,
        p.description,
        p.prixPublic ? formatPrix(p.prixPublic) : "",
        p.remise ? `-${p.remise}%` : "",
        formatPrix(p.prixUnitaire),
        String(p.quantite),
        formatPrix(total),
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["D\u00E9signation", "Description", "Prix public", "Remise", "Prix n\u00E9goci\u00E9", "Qt\u00E9", "Total HT"]],
      body: body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: { top: 4, right: 2, bottom: 4, left: 2 },
        overflow: "linebreak",
        textColor: [30, 58, 95] as any,
        lineColor: [191, 219, 254] as any,
        lineWidth: 0.3,
        minCellHeight: 10,
      },
      headStyles: {
        fillColor: [239, 246, 255] as any,
        textColor: [30, 58, 95] as any,
        fontStyle: "bold",
        halign: "center",
        fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "left" as const, fontStyle: "bold" as const },
        1: { cellWidth: 36, halign: "left" as const },
        2: { cellWidth: 24, halign: "right" as const },
        3: { cellWidth: 16, halign: "center" as const },
        4: { cellWidth: 26, halign: "right" as const, fontStyle: "bold" as const },
        5: { cellWidth: 12, halign: "center" as const },
        6: { cellWidth: 26, halign: "right" as const, fontStyle: "bold" as const },
      },
      margin: { left: 15, right: 15 },
      tableWidth: 180,
      didDrawCell: (hookData: any) => {
        // Barrer le prix public (colonne 2) dans le body
        if (hookData.section === "body" && hookData.column.index === 2 && hookData.cell.text[0]) {
          const cell = hookData.cell;
          const textY = cell.y + cell.height / 2;
          doc.setDrawColor(...STRIKE);
          doc.setLineWidth(0.4);
          doc.line(cell.x + 2, textY, cell.x + cell.width - 2, textY);
        }
      },
    });
  } else {
    // Standard : 5 colonnes
    for (let idx = 0; idx < produits.length; idx++) {
      const p = produits[idx];
      const total = p.prixUnitaire * p.quantite;
      body.push([
        p.nom,
        p.description,
        formatPrix(p.prixUnitaire),
        String(p.quantite),
        formatPrix(total),
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["D\u00E9signation", "Description", "Prix HT", "Qt\u00E9", "Total HT"]],
      body: body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        overflow: "linebreak",
        textColor: [30, 58, 95] as any,
        lineColor: [191, 219, 254] as any,
        lineWidth: 0.3,
        minCellHeight: 10,
      },
      headStyles: {
        fillColor: [239, 246, 255] as any,
        textColor: [30, 58, 95] as any,
        fontStyle: "bold",
        halign: "center",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 52, halign: "left" as const, fontStyle: "bold" as const },
        1: { cellWidth: 50, halign: "left" as const },
        2: { cellWidth: 32, halign: "right" as const },
        3: { cellWidth: 14, halign: "center" as const },
        4: { cellWidth: 32, halign: "right" as const, fontStyle: "bold" as const },
      },
      margin: { left: 15, right: 15 },
      tableWidth: 180,
    });
  }

  y = (doc as any).lastAutoTable.finalY + 6;

  y = addTotal(doc, { montant: totalHT, accent: NAVY }, y);
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
