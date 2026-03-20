/**
 * pdf-theme.ts — Style minimaliste unifié pour tous les PDFs 97import.com
 * Zéro fond sombre. Texte bleu marine. Bordures bleu clair.
 */

export const PDF_THEME = {
  colors: {
    background:      "#FFFFFF",
    textPrimary:     "#1E3A5F",  // bleu marine foncé
    textSecondary:   "#374151",  // gris foncé
    textMuted:       "#6B7280",  // gris
    border:          "#BFDBFE",  // bleu clair (séparateurs, lignes tableau)
    tableHeaderBg:   "#EFF6FF",  // bleu très pâle pour en-têtes tableau
    tableHeaderText: "#1E3A5F",  // bleu marine
    tableAltRow:     "#F9FAFB",  // gris très léger lignes alternées
    totalBorder:     "#1E3A5F",  // bordure bleu marine
    totalText:       "#1E3A5F",  // bleu marine gras
    accent:          "#4A90D9",  // bleu 97import
    accentLight:     "#DBEAFE",  // bleu très pâle
    tvaMuted:        "#9CA3AF",  // gris pâle mention TVA
    strikethrough:   "#9CA3AF",  // gris pâle prix barré
    vipPrice:        "#4A90D9",  // bleu pour prix négocié VIP
    invoiceAccent:   "#047857",  // vert pour factures
    commissionAccent:"#B45309",  // ambre pour commissions
  },
  fonts: {
    primary: "helvetica" as const,
  },
  sizes: {
    pageWidth:    210,
    pageHeight:   297,
    marginLeft:    15,
    marginRight:   15,
    marginTop:     20,
    marginBottom:  20,
    headerHeight:  32,
    footerHeight:  14,
  },
} as const;

// Tuples RGB pour jsPDF
export const NAVY:   [number, number, number] = [30, 58, 95];
export const GRAY2:  [number, number, number] = [55, 65, 81];
export const MUTED:  [number, number, number] = [107, 114, 128];
export const BLUE:   [number, number, number] = [74, 144, 217];
export const LIGHT_BLUE: [number, number, number] = [191, 219, 254];
export const TABLE_HEADER_BG: [number, number, number] = [239, 246, 255];
export const TABLE_ALT: [number, number, number] = [249, 250, 251];
export const WHITE:  [number, number, number] = [255, 255, 255];
export const STRIKE: [number, number, number] = [156, 163, 175];
export const GREEN_ACC: [number, number, number] = [4, 120, 87];
export const AMBER:  [number, number, number] = [180, 83, 9];
