/**
 * fees-pdf.ts — Génération PDF Frais Maritimes (FM) et Dédouanement (DD)
 * Appel autoTable DIRECT — contourne addProductTable pour fiabilité
 */

import autoTable from "jspdf-autotable";
import {
  createDocument,
  addPageHeader,
  addParties,
  addTotal,
  addTVAMention,
  addPageFooter,
  type DocType,
} from "../lib/pdf-engine";
import { BLUE, NAVY, LIGHT_BLUE, MUTED } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface FeeLigne {
  designation: string;
  description?: string;
  montant: number;
}

export interface FeesData {
  numeroDocument: string;
  date: string;
  type: "maritime" | "dedouanement";
  client: {
    nom: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    email: string;
    telephone?: string;
  };
  referenceDevis?: string;
  lignes: FeeLigne[];
  totalHT: number;
}

const ACCENT_FM: [number, number, number] = [2, 132, 199];   // bleu cyan
const ACCENT_DD: [number, number, number] = [124, 58, 237]; // violet

export function generateFeesPDF(data: FeesData): Blob {
  const doc = createDocument();
  const L = 15;
  const accent = data.type === "maritime" ? ACCENT_FM : ACCENT_DD;
  const docType: DocType = data.type === "maritime" ? "frais_maritimes" : "dedouanement";

  // ── En-tête ──────────────────────────────────────────────────────
  let y = addPageHeader(doc, {
    numeroDoc: data.numeroDocument,
    date: data.date,
    type: docType,
    accent,
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

  // ── Tableau frais — autoTable DIRECT ─────────────────────────────
  const body: string[][] = [];
  for (let idx = 0; idx < data.lignes.length; idx++) {
    const l = data.lignes[idx];
    body.push([
      l.designation,
      l.description || "",
      formatPrix(l.montant),
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [["D\u00E9signation", "D\u00E9tail", "Montant HT"]],
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
      fillColor: [239, 246, 255] as any,
      textColor: [30, 58, 95] as any,
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70, halign: "left" as const, fontStyle: "bold" as const },
      1: { cellWidth: 74, halign: "left" as const },
      2: { cellWidth: 36, halign: "right" as const, fontStyle: "bold" as const },
    },
    margin: { left: L, right: L },
    tableWidth: 180,
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Total ────────────────────────────────────────────────────────
  const labelTotal = data.type === "maritime"
    ? "TOTAL FRAIS MARITIMES HT\u00A0:"
    : "TOTAL D\u00C9DOUANEMENT HT\u00A0:";
  y = addTotal(doc, { montant: data.totalHT, label: labelTotal, accent }, y);

  addTVAMention(doc, y);
  addPageFooter(doc, { numeroDoc: data.numeroDocument });

  return doc.output("blob");
}
