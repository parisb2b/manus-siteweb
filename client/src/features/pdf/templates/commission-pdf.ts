/**
 * commission-pdf.ts — Génération PDF note de commission (style minimaliste)
 * v5.10: Colonnes corrigées — Réf. devis | Client | Produit | Prix remisé | Prix partenaire | Commission
 */

import autoTable from "jspdf-autotable";
import {
  createDocument,
  addPageHeader,
  addParties,
  addTotal,
  addPageFooter,
} from "../lib/pdf-engine";
import { AMBER, LIGHT_BLUE, MUTED, NAVY } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface CommissionData {
  numeroCommission: string;
  date: string;
  partenaire: {
    nom: string;
    email: string;
    telephone?: string;
  };
  devis: {
    numeroDevis: string;
    nomClient: string;
    produits: string;
    prixNegocie: number;
    prixPartenaire: number;
    commission: number;
  };
}

export function generateCommissionPDF(data: CommissionData): Blob {
  const doc = createDocument();
  const W = doc.internal.pageSize.getWidth();
  const L = 15;

  // ── En-tête ──────────────────────────────────────────────────────
  let y = addPageHeader(doc, {
    numeroDoc: data.numeroCommission,
    date: data.date,
    type: "commission",
    accent: AMBER,
  });

  // ── Parties ──────────────────────────────────────────────────────
  const partenaireLignes: string[] = [
    `Email\u00A0: ${data.partenaire.email}`,
  ];
  if (data.partenaire.telephone) partenaireLignes.push(`T\u00E9l\u00A0: ${data.partenaire.telephone}`);

  y = addParties(doc, {
    destinataire: {
      nom: data.partenaire.nom,
      lignes: partenaireLignes,
      label: "PARTENAIRE DESTINATAIRE",
    },
  }, y);

  // ── Tableau commission ──────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["R\u00E9f. devis", "Client", "Produit", "Prix remis\u00E9", "Prix partenaire", "Commission"]],
    body: [[
      data.devis.numeroDevis,
      data.devis.nomClient,
      data.devis.produits,
      formatPrix(data.devis.prixNegocie),
      formatPrix(data.devis.prixPartenaire),
      formatPrix(data.devis.commission),
    ]],
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
      fillColor: [255, 251, 235] as any,
      textColor: [30, 58, 95] as any,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "left" as const, fontStyle: "bold" as const },
      1: { cellWidth: 28, halign: "left" as const },
      2: { cellWidth: 49, halign: "left" as const },
      3: { cellWidth: 28, halign: "right" as const },
      4: { cellWidth: 26, halign: "right" as const },
      5: { cellWidth: 24, halign: "right" as const, fontStyle: "bold" as const },
    },
    margin: { left: L, right: L },
    tableWidth: 180,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Total commission ─────────────────────────────────────────
  y = addTotal(doc, {
    montant: data.devis.commission,
    label: "COMMISSION TOTALE\u00A0:",
    accent: AMBER,
  }, y);

  // ── Conditions ──────────────────────────────────────────────────
  y += 6;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.3);
  doc.roundedRect(L, y, W - L * 2, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...NAVY);
  doc.text("Conditions de r\u00E8glement", L + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("R\u00E8glement par virement bancaire \u2014 coordonn\u00E9es fournies sur demande.", L + 4, y + 13);
  doc.text("\u00C0 r\u00E9ception de la pr\u00E9sente note de commission.", L + 4, y + 18.5);

  addPageFooter(doc, { numeroDoc: data.numeroCommission });

  return doc.output("blob");
}
