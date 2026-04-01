/**
 * invoice-pdf.ts — Génération PDF facture (style minimaliste)
 * Appel autoTable DIRECT — contourne addProductTable pour fiabilité
 * v5.6: prix public barré + VIP violet, section acomptes cumulés
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
import { GREEN_ACC, STRIKE, NAVY } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface InvoiceProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;
  prixPublic?: number;
  quantite: number;
  total: number;
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
}

/** Parse robuste — gère Array, string JSON, double stringify, objet */
function parseProduits(raw: any): Array<{
  nom: string;
  description: string;
  prixUnitaire: number;
  prixPublic: number;
  quantite: number;
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
    prixPublic: Number(i.prixPublic ?? i.prix_public ?? 0),
    quantite: Number(i.quantite ?? i.qty ?? i.quantity ?? 1),
  }));
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

  const partiesOpts: any = { destinataire: { nom: data.client.nom, lignes: clientLignes } };
  if (data.emetteur) partiesOpts.emetteur = data.emetteur;
  y = addParties(doc, partiesOpts, y);

  // ── Tableau produits — appel autoTable DIRECT ────────────────────
  const body: any[][] = [];
  for (let idx = 0; idx < produits.length; idx++) {
    const p = produits[idx];
    const total = p.prixUnitaire * p.quantite;

    // Ligne prix public barré si différent du prix facturé
    if (p.prixPublic && p.prixPublic > p.prixUnitaire) {
      body.push([
        { content: `${p.nom} (prix public)`, styles: { textColor: STRIKE as any, fontStyle: "italic" as const } },
        { content: "", styles: { textColor: STRIKE as any } },
        { content: formatPrix(p.prixPublic), styles: { textColor: STRIKE as any, fontStyle: "italic" as const } },
        { content: String(p.quantite), styles: { textColor: STRIKE as any } },
        { content: formatPrix(p.prixPublic * p.quantite), styles: { textColor: STRIKE as any, fontStyle: "italic" as const } },
      ]);
    }

    // Ligne prix facturé (normal ou violet si remisé)
    const isRemise = p.prixPublic && p.prixPublic > p.prixUnitaire;
    const txtColor = isRemise ? [107, 33, 168] : NAVY; // violet #6B21A8 si remisé
    body.push([
      { content: p.nom, styles: { fontStyle: "bold" as const, textColor: txtColor as any } },
      { content: p.description, styles: { textColor: txtColor as any } },
      { content: formatPrix(p.prixUnitaire), styles: { textColor: txtColor as any } },
      { content: String(p.quantite), styles: { textColor: txtColor as any } },
      { content: formatPrix(total), styles: { fontStyle: "bold" as const, textColor: txtColor as any } },
    ]);
  }

  const totalHT = produits.reduce(
    (sum, p) => sum + p.prixUnitaire * p.quantite,
    0,
  );

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
    didDrawCell: (hookData: any) => {
      // Strikethrough on STRIKE-colored lines (prix public barré)
      if (hookData.section === "body") {
        const cellStyles = hookData.cell.styles;
        if (cellStyles && cellStyles.textColor &&
            Array.isArray(cellStyles.textColor) &&
            cellStyles.textColor[0] === STRIKE[0] && cellStyles.textColor[1] === STRIKE[1]) {
          const cell = hookData.cell;
          if (cell.text && cell.text.length > 0 && cell.text[0] !== "") {
            const textY = cell.y + cell.height / 2;
            doc.setDrawColor(...(STRIKE as [number, number, number]));
            doc.setLineWidth(0.4);
            doc.line(cell.x + 2, textY, cell.x + cell.width - 2, textY);
          }
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  const W = doc.internal.pageSize.getWidth();
  const L = 15;
  const xLabel = L + 104;
  const xValue = L + 176;
  const boxX = L + 100;
  const boxW = 80;

  // ── Total HT ──
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(boxX, y, boxW, 12, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
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
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(4, 120, 87);
      doc.text(`Acompte ${a.numero}`, xLabel, y + 4);
      doc.text(`\u2212 ${formatPrix(a.montant)}`, xValue, y + 4, { align: "right" });
      y += 8;
    }

    y += 2;

    // Total acomptes versés (fond vert)
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(boxX, y, boxW, 11, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(4, 120, 87);
    doc.text("Total acomptes vers\u00E9s", xLabel, y + 7.5);
    doc.text(`\u2212 ${formatPrix(totalAcomptes)}`, xValue, y + 7.5, { align: "right" });
    y += 15;

    // Solde restant ou Entièrement soldée
    const solde = totalHT - totalAcomptes;
    if (solde <= 0) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(L, y, W - L * 2, 13, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87);
      doc.text("ENTI\u00C8REMENT SOLD\u00C9E \u2713", W / 2, y + 9, { align: "center" });
    } else {
      doc.setFillColor(255, 247, 237);
      doc.roundedRect(boxX, y, boxW, 13, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(234, 88, 12);
      doc.text("SOLDE RESTANT", xLabel, y + 9);
      doc.text(formatPrix(solde), xValue, y + 9, { align: "right" });
    }
    y += 17;
  }

  // Mention "Date de paiement"
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
