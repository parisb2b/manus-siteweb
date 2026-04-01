/**
 * invoice-pdf.ts — Génération PDF facture (style minimaliste)
 * v5.10: Colonnes uniformes Réf. Interne | Produit | Prix HT | Qté | Total HT
 * buildProductRows partagé — 2 lignes gris barré + violet VIP
 * Section totaux : Total HT → séparateur → Acomptes → Solde
 */

import autoTable from "jspdf-autotable";
import {
  createDocument,
  addPageHeader,
  addParties,
  addTVAMention,
  addConditionsPage,
  addPageFooter,
} from "../lib/pdf-engine";
import { GREEN_ACC, NAVY } from "../lib/pdf-theme";
import { formatPrix, buildProductRows } from "../lib/pdf-helpers";

export interface InvoiceProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;
  prixPublic?: number;
  quantite: number;
  total: number;
  reference_interne?: string;
  numero_interne?: string;
}

export interface InvoiceAcompte {
  numero: number;
  montant: number;
  date: string;
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
  acomptes?: InvoiceAcompte[];
  emetteur?: {
    nom: string;
    lignes: string[];
  };
  prixNegocie?: number | null;
  prixTotalCalcule?: number;
}

/** Parse robuste — gère Array, string JSON, double stringify, objet */
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
    prixPublic: Number(i.prixPublic ?? i.prix_public ?? 0),
    prix_achat: i.prix_achat != null ? Number(i.prix_achat) : undefined,
    quantite: Number(i.quantite ?? i.qty ?? i.quantity ?? 1),
    reference_interne: i.reference_interne || i.ref || undefined,
    numero_interne: i.numero_interne || undefined,
  }));
}

export function generateInvoicePDF(data: InvoiceData): Blob {
  const doc = createDocument();
  const produits = parseProduits(data.produits);

  // Calcul totalHT réel
  const totalHTCalc = produits.reduce(
    (sum: number, p: any) => sum + (Number(p.prixUnitaire) || 0) * (Number(p.quantite) || 1),
    0,
  );
  const totalHT = data.totalHT || totalHTCalc;

  // Build rows via shared function
  const rows = buildProductRows(
    produits,
    data.prixNegocie ?? (totalHT < totalHTCalc ? totalHT : null),
    totalHTCalc,
  );

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

  const partiesOpts: any = { destinataire: { nom: data.client.nom, lignes: clientLignes } };
  if (data.emetteur) partiesOpts.emetteur = data.emetteur;
  y = addParties(doc, partiesOpts, y);

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

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginRight = pageWidth - 14;
  const L = 15;
  const xLabel = marginRight - 80;
  const xValue = marginRight;
  const boxX = xLabel - 4;
  const boxW = marginRight - boxX + 1;
  const fontSizeNormal = 9;
  const fontSizeSolde = 11;

  // ── Total HT ──
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(boxX, y, boxW, 12, 1.5, 1.5, "F");
  doc.setFontSize(fontSizeNormal + 1);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN_ACC);
  doc.text("Total HT", xLabel, y + 8);
  doc.text(formatPrix(totalHT), xValue, y + 8, { align: "right" });
  y += 16;

  // ── Section Acomptes cumulés ──
  const acomptes = data.acomptes || [];
  if (acomptes.length > 0) {
    const totalAcomptes = acomptes.reduce((s, a) => s + a.montant, 0);

    // Séparateur
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.3);
    doc.line(boxX, y, boxX + boxW, y);
    y += 6;

    // Lignes individuelles acomptes (vert)
    for (const a of acomptes) {
      doc.setFontSize(fontSizeNormal);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(4, 120, 87);
      doc.text(`Acompte ${a.numero}`, xLabel, y + 4);
      doc.text(`\u2212 ${formatPrix(a.montant)}`, xValue, y + 4, { align: "right" });
      y += 8;
    }

    y += 2;

    // Total acomptes versés (fond vert)
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(boxX, y, boxW, 11, 1.5, 1.5, "F");
    doc.setFontSize(fontSizeNormal);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text("Total acomptes vers\u00E9s", xLabel, y + 7.5);
    doc.text(`\u2212 ${formatPrix(totalAcomptes)}`, xValue, y + 7.5, { align: "right" });
    y += 15;

    // Solde restant ou Entièrement soldée
    const solde = totalHT - totalAcomptes;
    if (solde <= 0) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(L, y, pageWidth - L * 2, 13, 1.5, 1.5, "F");
      doc.setFontSize(fontSizeSolde);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(4, 120, 87);
      doc.text("ENTI\u00C8REMENT SOLD\u00C9E \u2713", pageWidth / 2, y + 9, { align: "center" });
    } else {
      doc.setFillColor(255, 247, 237);
      doc.roundedRect(boxX, y, boxW, 13, 1.5, 1.5, "F");
      doc.setFontSize(fontSizeSolde);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 88, 12);
      doc.text("SOLDE RESTANT", xLabel, y + 9);
      doc.text(formatPrix(solde), xValue, y + 9, { align: "right" });
    }
    y += 17;
  }

  // Mention "Date de paiement"
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(L, y, pageWidth - L * 2, 9, 1.5, 1.5, "F");
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
