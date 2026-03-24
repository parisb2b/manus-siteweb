/**
 * quote-pdf.ts — Génération PDF devis (style minimaliste)
 * Utilise pdf-engine.ts — Zéro fond sombre
 */

import {
  createDocument,
  addPageHeader,
  addParties,
  addProductTable,
  addTotal,
  addTVAMention,
  addConditionsPage,
  addPageFooter,
  drawVipPriceCell,
} from "../lib/pdf-engine";
import { NAVY, BLUE } from "../lib/pdf-theme";
import { formatPrix } from "../lib/pdf-helpers";

export interface QuoteProduit {
  nom: string;
  description?: string;
  prixUnitaire: number;   // prix client (selon son rôle)
  prixPublic?: number;    // prix référence ×1.5 (barré pour VIP)
  remise?: number;        // % de remise
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

/** Parse robuste des produits — gère Array, string JSON, double stringify, objet */
function parseProduits(raw: any): QuoteProduit[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") {
        const parsed2 = JSON.parse(parsed);
        if (Array.isArray(parsed2)) return parsed2;
      }
    } catch { return []; }
  }
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.produits)) return raw.produits;
  }
  return [];
}

export function generateQuotePDF(data: QuoteData): Blob {
  const doc = createDocument();
  const isVip = data.role === "vip";

  // Parser les produits de façon sécurisée
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

  // Tableau produits — recalculer total depuis les items
  const totalReel = produits.reduce((s, p) => {
    const pu = Number(p.prixUnitaire ?? (p as any).prixAffiche ?? (p as any).prix ?? 0);
    const qty = Number(p.quantite ?? (p as any).qty ?? 1);
    return s + pu * qty;
  }, 0);

  const customDrawMap: Record<number, (doc: any, hookData: any) => void> = {};
  if (isVip) {
    produits.forEach((p, i) => {
      const prixRef = p.prixPublic ?? p.prixUnitaire;
      customDrawMap[i] = (docRef, hookData) => {
        drawVipPriceCell(docRef, hookData, {
          prixPublic: prixRef,
          prixNegocie: p.prixUnitaire,
          remise: p.remise,
        });
      };
    });
  }

  y = addProductTable(
    doc,
    {
      columns: [
        { header: "D\u00E9signation", width: 52, bold: true },
        { header: "Description",     width: 50 },
        { header: "Prix HT",         width: 32, align: "right" },
        { header: "Qt\u00E9",        width: 14, align: "center" },
        { header: "Total HT",        width: 32, align: "right", bold: true },
      ],
      rows: produits.map((p) => {
        const nom = String((p as any).nom || (p as any).name || (p as any).designation || "—");
        const desc = String((p as any).description || "");
        const pu = Number(p.prixUnitaire ?? (p as any).prixAffiche ?? (p as any).prix ?? 0);
        const qty = Number(p.quantite ?? (p as any).qty ?? (p as any).quantity ?? 1);
        const total = pu * qty;
        return {
          cells: [
            nom,
            desc,
            isVip ? "" : formatPrix(pu),
            String(qty),
            formatPrix(total),
          ],
        };
      }),
      customColumnIndex: isVip ? 2 : undefined,
      customDrawMap: isVip ? customDrawMap : undefined,
    },
    y,
  );

  y = addTotal(doc, { montant: totalReel, accent: NAVY }, y);
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
