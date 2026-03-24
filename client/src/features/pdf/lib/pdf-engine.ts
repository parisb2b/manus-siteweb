/**
 * pdf-engine.ts — Moteur mutualisé pour tous les PDFs 97import.com
 *
 * Style minimaliste : fond blanc, texte bleu marine, bordures bleues claires.
 * Utilisé par quote-pdf.ts, invoice-pdf.ts, commission-pdf.ts.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  NAVY, GRAY2, MUTED, BLUE, LIGHT_BLUE, TABLE_HEADER_BG, TABLE_ALT, WHITE, STRIKE,
} from "./pdf-theme";
import { formatPrix, EMETTEUR } from "./pdf-helpers";

export type DocType = "devis" | "facture" | "commission";
export type AccentColor = [number, number, number];

// ── createDocument ─────────────────────────────────────────────────────────

export function createDocument(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.setFont("helvetica", "normal");
  return doc;
}

// ── addPageHeader ──────────────────────────────────────────────────────────

export interface HeaderOptions {
  numeroDoc: string;
  date: string;
  type: DocType;
  accent: AccentColor;
  subtitle?: string; // ex: "Réf. devis D2600001"
}

/**
 * Dessine l'en-tête minimaliste.
 * - Gauche : type + numéro en bleu marine gras + date en gris
 * - Droite : "97import.com" en accent + "Importation & Distribution" en gris
 * - Ligne séparatrice bleu clair en bas
 * @returns Y après l'en-tête
 */
export function addPageHeader(doc: jsPDF, opts: HeaderOptions): number {
  const W = doc.internal.pageSize.getWidth();
  const L = 15;

  // Titre principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  const label =
    opts.type === "devis" ? "Devis" :
    opts.type === "facture" ? "Facture" : "Note de commission";
  doc.text(`${label} ${opts.numeroDoc}`, L, 18);

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Date\u00A0: ${opts.date}`, L, 25);
  if (opts.subtitle) {
    doc.text(opts.subtitle, L, 30);
  }

  // Droite : 97import.com
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...opts.accent);
  doc.text("97import.com", W - L, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Importation & Distribution", W - L, 25, { align: "right" });

  // Séparateur bleu clair
  const sepY = opts.subtitle ? 34 : 30;
  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.8);
  doc.line(L, sepY, W - L, sepY);

  return sepY + 5;
}

// ── addParties ─────────────────────────────────────────────────────────────

export interface PartiesOptions {
  destinataire: {
    nom: string;
    lignes: string[];
    label?: string;
  };
  emetteurLabel?: string;
}

/**
 * Dessine la section émetteur (gauche) + destinataire (droite).
 * @returns Y après la section
 */
export function addParties(doc: jsPDF, opts: PartiesOptions, startY: number): number {
  const W = doc.internal.pageSize.getWidth();
  const L = 15;
  const MID = W / 2 + 5;
  let leftY = startY;
  let rightY = startY;

  // Étiquettes section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.text(opts.emetteurLabel ?? "\u00C9METTEUR", L, leftY);
  doc.text(opts.destinataire.label ?? "DESTINATAIRE", MID, rightY);

  // Émetteur — nom
  leftY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(EMETTEUR.nom, L, leftY);

  leftY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY2);
  EMETTEUR.lignes.forEach((l) => { doc.text(l, L, leftY); leftY += 5; });

  // Destinataire — nom
  rightY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(opts.destinataire.nom, MID, rightY);

  rightY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY2);
  opts.destinataire.lignes.forEach((l) => { doc.text(l, MID, rightY); rightY += 5; });

  const afterParties = Math.max(leftY, rightY) + 4;

  // Séparateur bleu clair
  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.5);
  doc.line(L, afterParties, W - L, afterParties);

  return afterParties + 5;
}

// ── addProductTable ────────────────────────────────────────────────────────

export interface TableColumn {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
  bold?: boolean;
}

export interface TableRow {
  cells: string[];
  /** Callback optionnel pour rendu personnalisé dans une cellule (ex: prix VIP barré) */
  customDraw?: (doc: jsPDF, cell: any, rowIndex: number) => void;
}

export interface ProductTableOptions {
  columns: TableColumn[];
  rows: TableRow[];
  /** Index colonne à rendre avec customDraw si applicable */
  customColumnIndex?: number;
  /** Callbacks customDraw par rowIndex */
  customDrawMap?: Record<number, (doc: jsPDF, hookData: any) => void>;
}

/**
 * Tableau produits avec style minimaliste bleu.
 * @returns Y après le tableau
 */
export function addProductTable(
  doc: jsPDF,
  opts: ProductTableOptions,
  startY: number,
): number {
  const L = 15;

  const bodyRows = opts.rows.map((r) => r.cells);

  // Debug logs — à retirer après validation
  console.log("[PDF-ENGINE] Nombre de rows:", bodyRows.length);
  console.log("[PDF-ENGINE] Body:", JSON.stringify(bodyRows));

  autoTable(doc, {
    startY,
    head: [opts.columns.map((c) => c.header)],
    body: bodyRows,
    theme: "grid",
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 30, 30],
      overflow: "linebreak",
      font: "helvetica",
    },
    headStyles: {
      fillColor: WHITE,          // fond blanc pur — zéro fond coloré (règle absolue)
      textColor: NAVY,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8.5,
      lineColor: LIGHT_BLUE,
      lineWidth: 0.4,
    },
    columnStyles: Object.fromEntries(
      opts.columns.map((c, i) => [
        i,
        {
          cellWidth: c.width,
          halign: c.align ?? "left",
          fontStyle: c.bold ? "bold" : "normal",
          minCellHeight: opts.customColumnIndex === i ? 16 : undefined,
        },
      ])
    ),
    alternateRowStyles: { fillColor: WHITE },  // lignes blanches uniformes
    tableLineColor: LIGHT_BLUE,
    tableLineWidth: 0.3,
    margin: { left: L, right: L },

    didDrawCell: (hookData: any) => {
      if (opts.customColumnIndex !== undefined && hookData.section === "body") {
        const customFn = opts.customDrawMap?.[hookData.row.index];
        if (customFn && hookData.column.index === opts.customColumnIndex) {
          customFn(doc, hookData);
        }
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

// ── addTotal ───────────────────────────────────────────────────────────────

export interface TotalOptions {
  montant: number;
  label?: string;
  accent: AccentColor;
}

/**
 * Encadré total : fond blanc, bordure bleu marine arrondie.
 * @returns Y après le bloc total
 */
export function addTotal(doc: jsPDF, opts: TotalOptions, startY: number): number {
  const W = doc.internal.pageSize.getWidth();
  const L = 15;
  const boxW = 82;
  const boxX = W - L - boxW;
  const boxH = 14;

  // Contour bleu marine
  doc.setDrawColor(...opts.accent);
  doc.setLineWidth(0.8);
  doc.setFillColor(...WHITE);
  doc.roundedRect(boxX, startY, boxW, boxH, 2, 2, "FD");

  // Texte
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...opts.accent);
  const label = opts.label ?? "TOTAL HT\u00A0:";
  doc.text(label, boxX + 5, startY + 9);
  doc.text(formatPrix(opts.montant), W - L - 4, startY + 9, { align: "right" });

  return startY + boxH + 5;
}

// ── addTVAMention ──────────────────────────────────────────────────────────

/**
 * Mention TVA en gris léger.
 * @returns Y après la mention
 */
export function addTVAMention(doc: jsPDF, startY: number): number {
  const W = doc.internal.pageSize.getWidth();
  const L = 15;

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(L, startY, W - L * 2, 9, 1.5, 1.5, "F");
  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.3);
  doc.roundedRect(L, startY, W - L * 2, 9, 1.5, 1.5, "S");

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("TVA non applicable, art. 293 B du CGI", L + 4, startY + 6);

  return startY + 13;
}

// ── addPageFooter ──────────────────────────────────────────────────────────

export function addPageFooter(
  doc: jsPDF,
  opts: { numeroDoc: string; page?: number; totalPages?: number },
): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = 15;

  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.3);
  doc.line(L, H - 12, W - L, H - 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`${opts.numeroDoc} \u2014 97import.com / LUXENT LIMITED`, W / 2, H - 6, { align: "center" });

  if (opts.page && opts.totalPages) {
    doc.text(`Page ${opts.page} / ${opts.totalPages}`, W - L, H - 6, { align: "right" });
  }
}

// ── addConditionsPage ──────────────────────────────────────────────────────

export interface ConditionsOptions {
  numeroDoc: string;
  date: string;
  type: DocType;
  accent: AccentColor;
  showBonPourAccord?: boolean;
  modeReglement?: string;
  referenceDevis?: string;
}

/**
 * Page 2 : conditions générales + bon pour accord (devis) ou infos bancaires (facture).
 */
export function addConditionsPage(doc: jsPDF, opts: ConditionsOptions): void {
  doc.addPage();
  const W = doc.internal.pageSize.getWidth();
  const L = 15;
  let y = 20;

  // Titre page 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  const pageTitle =
    opts.type === "facture"
      ? "Conditions de r\u00E8glement"
      : "Conditions g\u00E9n\u00E9rales & Bon pour accord";
  doc.text(pageTitle, L, y);

  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.6);
  doc.line(L, y + 3, W - L, y + 3);
  y += 12;

  // Helper section
  const section = (title: string, lines: string[]) => {
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.setDrawColor(...LIGHT_BLUE);
    doc.setLineWidth(0.3);
    doc.roundedRect(L, y, W - L * 2, 8, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(title, L + 4, y + 5.5);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY2);
    lines.forEach((l) => { doc.text(l, L + 4, y); y += 5.5; });
    y += 4;
  };

  if (opts.type === "facture") {
    section("Mode de r\u00E8glement", [
      opts.modeReglement ?? "Virement bancaire",
      "IBAN\u00A0: \u00E0 confirmer par email \u00E0 luxent@ltd-uk.eu",
      `R\u00E9f\u00E9rence \u00E0 mentionner\u00A0: ${opts.numeroDoc}`,
    ]);
    section("Date de paiement", ["\u00C0 r\u00E9ception de la pr\u00E9sente facture."]);
    if (opts.referenceDevis) {
      section("R\u00E9f\u00E9rence devis", [
        `Cette facture fait suite au devis ${opts.referenceDevis} du ${opts.date}.`,
      ]);
    }
    section("Informations l\u00E9gales", [
      "LUXENT LIMITED \u2014 N\u00B0 entreprise 14852122",
      "2nd Floor College House, 17 King Edwards Road Ruislip, HA4 7AE London, UK",
      "Email\u00A0: luxent@ltd-uk.eu",
    ]);
  } else {
    section("Conditions de r\u00E8glement", ["\u00C0 r\u00E9ception de la facture."]);
    section("Mode de r\u00E8glement", [
      opts.modeReglement ?? "Virement bancaire \u2014 coordonn\u00E9es fournies sur la facture.",
    ]);
    section("Livraison", [
      "Les d\u00E9lais de livraison sont donn\u00E9s \u00E0 titre indicatif.",
      "Frais de livraison et dédouanement non inclus, calcul\u00E9s s\u00E9par\u00E9ment.",
    ]);
    section("Validit\u00E9", [
      `Ce devis est valable 30 jours \u00E0 compter du ${opts.date}.`,
    ]);

    // Bon pour accord
    if (opts.showBonPourAccord !== false) {
      y += 4;
      doc.setFillColor(...WHITE);
      doc.setDrawColor(...LIGHT_BLUE);
      doc.setLineWidth(0.6);
      doc.roundedRect(L, y, W - L * 2, 84, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...NAVY);
      doc.text("Bon pour accord", W / 2, y + 10, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY2);
      doc.text(
        "En signant ce devis, le client accepte les conditions g\u00E9n\u00E9rales de vente et le montant ci-dessus.",
        W / 2, y + 18, { align: "center", maxWidth: W - 50 }
      );

      const fY = y + 30;
      const fw = (W - L * 2 - 10) / 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...NAVY);
      doc.text("Fait \u00E0\u00A0:", L + 4, fY);
      doc.setDrawColor(...LIGHT_BLUE);
      doc.setLineWidth(0.4);
      doc.line(L + 4, fY + 10, L + fw, fY + 10);

      doc.text("Le\u00A0:", L + fw + 8, fY);
      doc.line(L + fw + 8, fY + 10, L + fw * 2 + 8, fY + 10);

      const sY = fY + 20;
      doc.text("Signature\u00A0:", L + 4, sY);
      doc.setFillColor(252, 252, 253);
      doc.setDrawColor(...LIGHT_BLUE);
      doc.roundedRect(L + 4, sY + 4, fw - 6, 22, 1.5, 1.5, "FD");

      doc.text("Qualit\u00E9 du signataire\u00A0:", L + fw + 8, sY);
      doc.line(L + fw + 8, sY + 14, L + fw * 2 + 8, sY + 14);
      doc.line(L + fw + 8, sY + 26, L + fw * 2 + 8, sY + 26);
    }
  }

  addPageFooter(doc, { numeroDoc: opts.numeroDoc, page: 2, totalPages: 2 });
}

// ── VIP prix barré helper ──────────────────────────────────────────────────

export interface VipPriceDrawOptions {
  prixPublic: number;   // prix barré (gris)
  prixNegocie: number;  // prix accent (bleu)
  remise?: number;      // % ex: 15
}

/**
 * À utiliser dans didDrawCell pour la colonne "Prix HT" en mode VIP.
 * Dessine : prix barré gris + prix bleu négocié + remise %.
 */
export function drawVipPriceCell(
  doc: jsPDF,
  hookData: any,
  opts: VipPriceDrawOptions,
): void {
  const { x, y: cy, width, height } = hookData.cell;
  const rightX = x + width - 3;

  // Prix public barré
  const refStr = formatPrix(opts.prixPublic);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...STRIKE);
  const refY = cy + height * 0.35;
  doc.text(refStr, rightX, refY, { align: "right" });
  const tw = doc.getTextWidth(refStr);
  doc.setDrawColor(...STRIKE);
  doc.setLineWidth(0.4);
  doc.line(rightX - tw, refY - 1, rightX, refY - 1);

  // Prix négocié en bleu
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLUE);
  doc.text(formatPrix(opts.prixNegocie), rightX, cy + height * 0.68, { align: "right" });

  // % remise
  if (opts.remise && opts.remise > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...BLUE);
    doc.text(`\u221215\u00A0%`, rightX, cy + height * 0.88, { align: "right" });
  }
}
