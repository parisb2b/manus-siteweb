/**
 * suivi-achats.ts — Génération Excel Suivi Achats (bilingue FR/CH)
 * 22 colonnes pour le suivi complet des commandes d'import
 */

import * as XLSX from "xlsx";

export interface SuiviAchatRow {
  // Infos devis
  numeroDevis: string;
  dateDevis: string;
  client: string;
  emailClient: string;
  // Produit
  produit: string;
  reference?: string;
  quantite: number;
  // Prix
  prixAchat: number;
  prixVente: number;
  marge: number;
  // Partenaire
  partenaire?: string;
  commission?: number;
  // Statut
  statutDevis: string;
  factureGeneree: boolean;
  numeroFacture?: string;
  // Acomptes
  acomptePaye: boolean;
  montantAcompte?: number;
  soldePaye: boolean;
  // Logistique
  fraisMaritimes?: number;
  fraisDedouanement?: number;
  dateLivraisonPrevue?: string;
  notes?: string;
}

// En-têtes bilingues FR / CH (chinois simplifié)
const HEADERS_FR = [
  "N° Devis",
  "Date devis",
  "Client",
  "Email client",
  "Produit",
  "Référence",
  "Quantité",
  "Prix achat (€)",
  "Prix vente (€)",
  "Marge (€)",
  "Partenaire",
  "Commission (€)",
  "Statut devis",
  "Facturé",
  "N° Facture",
  "Acompte payé",
  "Montant acompte (€)",
  "Solde payé",
  "Frais maritimes (€)",
  "Dédouanement (€)",
  "Date livraison prévue",
  "Notes",
];

const HEADERS_CH = [
  "报价编号",
  "报价日期",
  "客户",
  "客户邮箱",
  "产品",
  "参考号",
  "数量",
  "采购价 (€)",
  "销售价 (€)",
  "利润 (€)",
  "合作伙伴",
  "佣金 (€)",
  "报价状态",
  "已开票",
  "发票号",
  "已付定金",
  "定金金额 (€)",
  "已付尾款",
  "海运费 (€)",
  "清关费 (€)",
  "预计交货日期",
  "备注",
];

function rowToArray(r: SuiviAchatRow): (string | number | boolean)[] {
  return [
    r.numeroDevis,
    r.dateDevis,
    r.client,
    r.emailClient,
    r.produit,
    r.reference || "",
    r.quantite,
    r.prixAchat,
    r.prixVente,
    r.marge,
    r.partenaire || "",
    r.commission ?? 0,
    r.statutDevis,
    r.factureGeneree ? "Oui" : "Non",
    r.numeroFacture || "",
    r.acomptePaye ? "Oui" : "Non",
    r.montantAcompte ?? 0,
    r.soldePaye ? "Oui" : "Non",
    r.fraisMaritimes ?? 0,
    r.fraisDedouanement ?? 0,
    r.dateLivraisonPrevue || "",
    r.notes || "",
  ];
}

export function generateSuiviAchatsExcel(rows: SuiviAchatRow[]): Blob {
  const wb = XLSX.utils.book_new();

  // Feuille FR
  const dataFR = [HEADERS_FR, ...rows.map(rowToArray)];
  const wsFR = XLSX.utils.aoa_to_sheet(dataFR);

  // Largeurs colonnes
  wsFR["!cols"] = HEADERS_FR.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  XLSX.utils.book_append_sheet(wb, wsFR, "Suivi Achats FR");

  // Feuille CH
  const dataCH = [HEADERS_CH, ...rows.map(rowToArray)];
  const wsCH = XLSX.utils.aoa_to_sheet(dataCH);
  wsCH["!cols"] = HEADERS_CH.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  XLSX.utils.book_append_sheet(wb, wsCH, "采购跟踪 CH");

  // Générer le blob
  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
