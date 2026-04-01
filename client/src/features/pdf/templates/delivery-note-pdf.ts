/**
 * delivery-note-pdf.ts — Génération PDF Bon de Livraison (BL)
 * v5.10: Colonnes uniformes Réf. Interne | Produit | Qté | État
 * Pas de prix sur le BL — pas de 2 lignes
 */

import autoTable from "jspdf-autotable";
import {
  createDocument,
  addPageHeader,
  addParties,
  addPageFooter,
} from "../lib/pdf-engine";
import { NAVY, LIGHT_BLUE, MUTED } from "../lib/pdf-theme";

export interface BLProduit {
  designation: string;
  nom?: string;
  name?: string;
  reference?: string;
  reference_interne?: string;
  numero_interne?: string;
  quantite: number;
  observations?: string;
  etat?: string;
}

export interface DeliveryNoteData {
  numeroBL: string;
  date: string;
  referenceDevis?: string;
  client: {
    nom: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    email: string;
    telephone?: string;
  };
  adresseLivraison?: {
    adresse: string;
    ville: string;
    pays?: string;
  };
  produits: BLProduit[];
  notes?: string;
}

const ACCENT_BL: [number, number, number] = [22, 163, 74]; // vert

export function generateDeliveryNotePDF(data: DeliveryNoteData): Blob {
  const doc = createDocument();
  const W = doc.internal.pageSize.getWidth();
  const L = 15;

  // ── En-tête ──────────────────────────────────────────────────────
  let y = addPageHeader(doc, {
    numeroDoc: data.numeroBL,
    date: data.date,
    type: "bon_livraison",
    accent: ACCENT_BL,
    subtitle: data.referenceDevis ? `R\u00E9f. devis\u00A0: ${data.referenceDevis}` : undefined,
  });

  // ── Parties ──────────────────────────────────────────────────────
  const clientLignes: string[] = [];
  if (data.client.adresse) clientLignes.push(data.client.adresse);
  if (data.client.ville) clientLignes.push(data.client.ville);
  if (data.client.pays) clientLignes.push(data.client.pays);
  clientLignes.push(`Email\u00A0: ${data.client.email}`);
  if (data.client.telephone) clientLignes.push(`T\u00E9l\u00A0: ${data.client.telephone}`);

  y = addParties(doc, { destinataire: { nom: data.client.nom, lignes: clientLignes } }, y);

  // ── Adresse de livraison (si différente) ─────────────────────────
  if (data.adresseLivraison) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(...LIGHT_BLUE);
    doc.setLineWidth(0.3);
    doc.roundedRect(L, y, W - L * 2, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text("Adresse de livraison", L + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(data.adresseLivraison.adresse, L + 4, y + 11);
    doc.text(`${data.adresseLivraison.ville}${data.adresseLivraison.pays ? ` \u2014 ${data.adresseLivraison.pays}` : ""}`, L + 4, y + 15.5);

    y += 22;
  }

  // ── Tableau produits — Réf. Interne | Produit | Qté | État ──────
  const body: string[][] = [];
  for (const p of data.produits) {
    const ref = p.numero_interne || p.reference_interne || p.reference || "\u2014";
    const nom = p.designation || p.nom || p.name || "";
    body.push([
      ref,
      nom,
      String(p.quantite),
      p.etat || p.observations || "Conforme \u2705",
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [["R\u00E9f. Interne", "Produit", "Qt\u00E9", "\u00C9tat"]],
    body,
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
      fillColor: [236, 253, 245] as any,
      textColor: [30, 58, 95] as any,
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 35, halign: "left" as const },
      1: { cellWidth: 95, halign: "left" as const, fontStyle: "bold" as const },
      2: { cellWidth: 20, halign: "center" as const },
      3: { cellWidth: 30, halign: "center" as const },
    },
    margin: { left: L, right: L },
    tableWidth: 180,
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Notes ────────────────────────────────────────────────────────
  if (data.notes) {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(...LIGHT_BLUE);
    doc.setLineWidth(0.3);
    doc.roundedRect(L, y, W - L * 2, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text("Notes", L + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(data.notes, L + 4, y + 12, { maxWidth: W - L * 2 - 8 });

    y += 22;
  }

  // ── Signature réception ──────────────────────────────────────────
  y += 4;
  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.5);
  doc.roundedRect(L, y, W - L * 2, 40, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("R\u00E9ception de la marchandise", L + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Re\u00E7u le\u00A0:", L + 4, y + 16);
  doc.line(L + 25, y + 16, L + 80, y + 16);

  doc.text("Signature\u00A0:", L + 4, y + 26);
  doc.setFillColor(252, 252, 253);
  doc.roundedRect(L + 25, y + 20, 60, 16, 1.5, 1.5, "FD");

  doc.text("Observations\u00A0:", L + 95, y + 16);
  doc.line(L + 95, y + 24, W - L - 4, y + 24);
  doc.line(L + 95, y + 32, W - L - 4, y + 32);

  addPageFooter(doc, { numeroDoc: data.numeroBL });

  return doc.output("blob");
}
