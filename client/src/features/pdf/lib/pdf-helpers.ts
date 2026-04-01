/**
 * pdf-helpers.ts — Utilitaires partagés pour la génération PDF
 */

/** Formate un nombre en euros — espaces ASCII standards (compatible jsPDF) */
export function formatPrix(n: number): string {
  if (n == null || isNaN(n)) return "0,00 \u20AC";
  const abs = Math.abs(n);
  const parts = abs.toFixed(2).split(".");
  const entier = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (n < 0 ? "-" : "") + entier + "," + parts[1] + " \u20AC";
}

/** Formate une date ISO en date française */
export function formatDate(isoOrDate?: string | Date): string {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Couleurs pour buildProductRows ──
const GREY_BARRE: [number, number, number] = [192, 192, 192];
const VIOLET_VIP: [number, number, number] = [107, 33, 168];
const TEXT_NORMAL: [number, number, number] = [55, 65, 81];

export interface ProductRow {
  ref_interne: string;
  designation: string;
  prix: string;
  qte: string;
  total: string;
  _style: { textColor: number[]; fontStyle: string };
  _barre: boolean;
}

/**
 * Construit les lignes produits pour autoTable.
 * Si prixNegocie < prixTotalCalcule → mode VIP : 2 lignes (gris barré + violet).
 * Sinon → 1 ligne normale.
 */
export function buildProductRows(
  produits: any[],
  prixNegocie: number | null,
  prixTotalCalcule: number,
): ProductRow[] {
  const rows: ProductRow[] = [];

  const ratio =
    prixNegocie && prixTotalCalcule > 0 && prixNegocie < prixTotalCalcule
      ? prixNegocie / prixTotalCalcule
      : null;

  for (const produit of produits) {
    const ref =
      produit.numero_interne ||
      produit.reference_interne ||
      produit.ref ||
      "\u2014";

    const nom = produit.nom || produit.name || produit.designation || "";
    const qte = Number(produit.quantite ?? produit.qty ?? produit.quantity ?? 1);

    const prixPublic = produit.prix_achat
      ? produit.prix_achat * 2
      : Number(produit.prixPublic ?? produit.prix_public ?? produit.prixUnitaire ?? produit.prixAffiche ?? 0);

    const prixUnitaire = Number(
      produit.prixUnitaire ?? produit.prixAffiche ?? produit.prix ?? 0,
    );

    const prixRemise = ratio
      ? Math.round(prixUnitaire * ratio * 100) / 100
      : null;

    const isVIP =
      prixRemise !== null && prixRemise < prixPublic && prixPublic > 0;

    if (isVIP) {
      // LIGNE 1 — Prix public gris barré
      rows.push({
        ref_interne: ref,
        designation: `${nom} (prix public)`,
        prix: formatPrix(prixPublic),
        qte: String(qte),
        total: formatPrix(prixPublic * qte),
        _style: {
          textColor: GREY_BARRE as any,
          fontStyle: "italic",
        },
        _barre: true,
      });

      // LIGNE 2 — Prix VIP violet
      rows.push({
        ref_interne: ref,
        designation: `${nom} \u2605 VIP`,
        prix: formatPrix(prixRemise),
        qte: String(qte),
        total: formatPrix(prixRemise * qte),
        _style: {
          textColor: VIOLET_VIP as any,
          fontStyle: "bold",
        },
        _barre: false,
      });
    } else {
      // LIGNE UNIQUE — Prix normal
      rows.push({
        ref_interne: ref,
        designation: nom,
        prix: formatPrix(prixUnitaire),
        qte: String(qte),
        total: formatPrix(prixUnitaire * qte),
        _style: {
          textColor: TEXT_NORMAL as any,
          fontStyle: "normal",
        },
        _barre: false,
      });
    }
  }

  return rows;
}

/**
 * autoTable hooks partagés pour willDrawCell / didDrawCell
 * Appliquer styles VIP + strikethrough sur lignes barrées.
 */
export const productTableHooks = {
  willDrawCell: (data: any) => {
    const row = data.row?.raw;
    if (row?._style && data.section === "body") {
      data.cell.styles.textColor = row._style.textColor;
      data.cell.styles.fontStyle = row._style.fontStyle;
    }
  },
  didDrawCell: (doc: any, data: any) => {
    const row = data.row?.raw;
    if (row?._barre && data.section === "body") {
      const cell = data.cell;
      if (cell.text && cell.text.length > 0 && cell.text[0] !== "") {
        const textY = cell.y + cell.height / 2;
        doc.setDrawColor(...GREY_BARRE);
        doc.setLineWidth(0.3);
        doc.line(cell.x + 1, textY, cell.x + cell.width - 1, textY);
      }
    }
  },
};

/** Coordonnées LUXENT LIMITED (émetteur constant) */
export const EMETTEUR = {
  nom: "LUXENT LIMITED",
  lignes: [
    "2ND FLOOR COLLEGE HOUSE",
    "17 KING EDWARDS ROAD RUISLIP",
    "HA4 7AE LONDON, Royaume-Uni",
    "N\u00B0 entreprise\u00A0: 14852122",
    "Email\u00A0: luxent@ltd-uk.eu",
  ],
};
