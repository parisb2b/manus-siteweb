/**
 * quote-pdf.ts — Génération PDF devis (style minimaliste)
 * Appel autoTable DIRECT — contourne addProductTable pour fiabilité
 */

import jsPDF from "jspdf";
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
import { NAVY, BLUE, LIGHT_BLUE, WHITE } from "../lib/pdf-theme";
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

  const totalHT = produits.reduce(
    (sum, p) => sum + p.prixUnitaire * p.quantite,
    0,
  );

  // Debug log
  console.log("[PDF-DIRECT] body.length:", body.length, "body:", JSON.stringify(body));

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
    didDrawPage: () => {},
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ── VIP : redessiner les prix barrés si nécessaire ───────────────
  // (supprimé pour simplifier — à ajouter ultérieurement si besoin)

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
