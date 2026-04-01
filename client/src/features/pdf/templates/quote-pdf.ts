/**
 * quote-pdf.ts — Génération PDF devis (style minimaliste)
 * v5.10: Colonnes uniformes Réf. Interne | Produit | Prix HT | Qté | Total HT
 * buildProductRows partagé — 2 lignes gris barré + violet VIP
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
import { NAVY } from "../lib/pdf-theme";
import { buildProductRows, productTableHooks } from "../lib/pdf-helpers";

export interface QuoteProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;
  prixPublic?: number;
  remise?: number;
  quantite: number;
  total: number;
  reference_interne?: string;
  numero_interne?: string;
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
  prixNegocie?: number | null;
  prixTotalCalcule?: number;
}

/** Parse robuste */
function parseProduits(raw: any): any[] {
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
    prix_achat: i.prix_achat != null ? Number(i.prix_achat) : undefined,
    remise: i.remise != null ? Number(i.remise) : undefined,
    reference_interne: i.reference_interne || i.ref || undefined,
    numero_interne: i.numero_interne || undefined,
  }));
}

export function generateQuotePDF(data: QuoteData): Blob {
  const doc = createDocument();
  const produits = parseProduits(data.produits);

  // Calcul totalHT réel
  const totalHT = produits.reduce(
    (sum: number, p: any) => sum + (Number(p.prixUnitaire) || 0) * (Number(p.quantite) || 1),
    0,
  );

  // Build rows via shared function
  const rows = buildProductRows(
    produits,
    data.prixNegocie ?? (data.totalHT < totalHT ? data.totalHT : null),
    totalHT,
  );

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

  // ── Tableau produits — colonnes uniformes ────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["R\u00E9f. Interne", "Produit", "Prix HT", "Qt\u00E9", "Total HT"]],
    body: rows.map((r) => [r.ref_interne, r.designation, r.prix, r.qte, r.total]),
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
      0: { cellWidth: 30, halign: "left" as const },
      1: { cellWidth: 80, halign: "left" as const },
      2: { cellWidth: 25, halign: "right" as const },
      3: { cellWidth: 15, halign: "center" as const },
      4: { cellWidth: 30, halign: "right" as const, fontStyle: "bold" as const },
    },
    margin: { left: 15, right: 15 },
    tableWidth: 180,
    willDrawCell: (hookData: any) => {
      // Map _style from original rows array
      const rowIdx = hookData.row?.index;
      if (hookData.section === "body" && rowIdx != null && rows[rowIdx]?._style) {
        hookData.cell.styles.textColor = rows[rowIdx]._style.textColor;
        hookData.cell.styles.fontStyle = rows[rowIdx]._style.fontStyle;
      }
    },
    didDrawCell: (hookData: any) => {
      const rowIdx = hookData.row?.index;
      if (hookData.section === "body" && rowIdx != null && rows[rowIdx]?._barre) {
        const cell = hookData.cell;
        if (cell.text && cell.text.length > 0 && cell.text[0] !== "") {
          const textY = cell.y + cell.height / 2;
          doc.setDrawColor(192, 192, 192);
          doc.setLineWidth(0.3);
          doc.line(cell.x + 1, textY, cell.x + cell.width - 1, textY);
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  y = addTotal(doc, { montant: data.totalHT, accent: NAVY }, y);
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
