/**
 * commission-pdf.ts — Génération PDF note de commission (style minimaliste)
 * Utilise pdf-engine.ts — Zéro fond sombre
 */

import {
  createDocument,
  addPageHeader,
  addParties,
  addProductTable,
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
  const H = doc.internal.pageSize.getHeight();
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

  // ── Tableau commission ─────────────────────────────────────────
  y = addProductTable(
    doc,
    {
      columns: [
        { header: "R\u00E9f. devis",     width: 26, bold: true },
        { header: "Client",              width: 30 },
        { header: "Produit(s)",          width: 52 },
        { header: "Prix n\u00E9goci\u00E9", width: 28, align: "right" },
        { header: "Prix partenaire",     width: 26, align: "right" },
        { header: "Commission",          width: 20, align: "right", bold: true },
      ],
      rows: [{
        cells: [
          data.devis.numeroDevis,
          data.devis.nomClient,
          data.devis.produits,
          formatPrix(data.devis.prixNegocie),
          formatPrix(data.devis.prixPartenaire),
          formatPrix(data.devis.commission),
        ],
      }],
    },
    y,
  );

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
