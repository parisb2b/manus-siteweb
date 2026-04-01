/**
 * quote-pdf.ts — Génération PDF devis (style minimaliste)
 * v5.8: VIP = 2 lignes par produit (prix public barré gris + prix remisé violet)
 * Appel autoTable DIRECT
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
import { NAVY, STRIKE } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface QuoteProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;
  prixPublic?: number;
  remise?: number;
  quantite: number;
  total: number;
  reference_interne?: string;
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

/** Parse robuste */
function parseProduits(raw: any): Array<{
  nom: string;
  description: string;
  prixUnitaire: number;
  quantite: number;
  prixPublic?: number;
  remise?: number;
  reference_interne?: string;
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
    prixPublic: i.prixPublic != null ? Number(i.prixPublic) : (i.prix_public != null ? Number(i.prix_public) : undefined),
    remise: i.remise != null ? Number(i.remise) : undefined,
    reference_interne: i.reference_interne || i.ref || undefined,
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

  // ── Tableau produits ────────────────────────────────────────
  const body: any[][] = [];
  const totalHT = produits.reduce(
    (sum, p) => sum + p.prixUnitaire * p.quantite,
    0,
  );

  if (isVip) {
    // VIP: 2 lignes par produit — prix public barré + prix remisé violet
    for (const p of produits) {
      const ref = p.reference_interne ? `${p.reference_interne} — ` : "";
      const total = p.prixUnitaire * p.quantite;

      // Ligne 1 — prix public barré (gris clair italic)
      if (p.prixPublic && p.prixPublic > p.prixUnitaire) {
        body.push([
          { content: `${ref}${p.nom} (prix public)`, styles: { textColor: [180, 180, 180] as any, fontStyle: "italic" as const } },
          { content: formatPrix(p.prixPublic), styles: { textColor: [180, 180, 180] as any, fontStyle: "italic" as const } },
          { content: String(p.quantite), styles: { textColor: [180, 180, 180] as any } },
          { content: formatPrix(p.prixPublic * p.quantite), styles: { textColor: [180, 180, 180] as any, fontStyle: "italic" as const } },
        ]);
      }

      // Ligne 2 — prix remisé violet
      const isRemise = p.prixPublic && p.prixPublic > p.prixUnitaire;
      const txtColor = isRemise ? [107, 33, 168] : NAVY; // violet si remisé
      body.push([
        { content: `${ref}${p.nom}${isRemise ? " \u2605 VIP" : ""}`, styles: { fontStyle: "bold" as const, textColor: txtColor as any } },
        { content: formatPrix(p.prixUnitaire), styles: { fontStyle: "bold" as const, textColor: txtColor as any } },
        { content: String(p.quantite), styles: { textColor: txtColor as any } },
        { content: formatPrix(total), styles: { fontStyle: "bold" as const, textColor: txtColor as any } },
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["D\u00E9signation", "Prix HT", "Qt\u00E9", "Total HT"]],
      body: body,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        overflow: "linebreak",
        textColor: NAVY as any,
        lineColor: [191, 219, 254] as any,
        lineWidth: 0.3,
        minCellHeight: 10,
      },
      headStyles: {
        fillColor: [239, 246, 255] as any,
        textColor: NAVY as any,
        fontStyle: "bold",
        halign: "center",
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 90, halign: "left" as const },
        1: { cellWidth: 30, halign: "right" as const },
        2: { cellWidth: 16, halign: "center" as const },
        3: { cellWidth: 30, halign: "right" as const },
      },
      margin: { left: 15, right: 15 },
      tableWidth: 180,
      didDrawCell: (hookData: any) => {
        // Strikethrough on grey lines (prix public barré)
        if (hookData.section === "body") {
          const cellStyles = hookData.cell.styles;
          if (cellStyles && cellStyles.textColor &&
              Array.isArray(cellStyles.textColor) &&
              cellStyles.textColor[0] === 180 && cellStyles.textColor[1] === 180) {
            const cell = hookData.cell;
            if (cell.text && cell.text.length > 0 && cell.text[0] !== "") {
              const textY = cell.y + cell.height / 2;
              doc.setDrawColor(180, 180, 180);
              doc.setLineWidth(0.4);
              doc.line(cell.x + 2, textY, cell.x + cell.width - 2, textY);
            }
          }
        }
      },
    });
  } else {
    // Standard : 5 colonnes
    for (const p of produits) {
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
        textColor: NAVY as any,
        lineColor: [191, 219, 254] as any,
        lineWidth: 0.3,
        minCellHeight: 10,
      },
      headStyles: {
        fillColor: [239, 246, 255] as any,
        textColor: NAVY as any,
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
