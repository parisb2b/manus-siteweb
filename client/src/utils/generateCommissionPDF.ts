import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatPrix(n: number): string {
  const abs = Math.abs(n);
  const entier = Math.floor(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const cents = Math.round((abs % 1) * 100).toString().padStart(2, "0");
  return (n < 0 ? "-" : "") + entier + "," + cents + " \u20AC";
}

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

const PRIMARY = [74, 144, 217] as [number, number, number];
const DARK    = [26, 26, 46]  as [number, number, number];
const GRAY    = [100, 100, 100] as [number, number, number];
const LIGHT   = [245, 245, 245] as [number, number, number];
const ORANGE  = [234, 88, 12]  as [number, number, number];

export function generateCommissionPDF(data: CommissionData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Header ───────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(`Note de commission N\u00B0${data.numeroCommission}`, 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 230);
  doc.text(`Date : ${data.date}`, 14, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...ORANGE);
  doc.text("97import.com", W - 14, 12, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 230);
  doc.text("Importation & Distribution", W - 14, 20, { align: "right" });

  // ── Bloc émetteur ────────────────────────────────────────────────
  let y = 38;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ORANGE);
  doc.text("\u00C9METTEUR", 14, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("LUXENT LIMITED", 14, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  ["2ND FLOOR COLLEGE HOUSE", "17 KING EDWARDS ROAD RUISLIP", "HA4 7AE LONDON, Royaume-Uni",
    "N\u00B0 entreprise : 14852122", "Email : luxent@ltd-uk.eu"].forEach((l) => {
    doc.text(l, 14, y); y += 5;
  });

  // ── Bloc destinataire ────────────────────────────────────────────
  const rx = W / 2 + 5;
  let ry = 38;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ORANGE);
  doc.text("PARTENAIRE DESTINATAIRE", rx, ry);

  ry += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(data.partenaire.nom, rx, ry);

  ry += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(`Email : ${data.partenaire.email}`, rx, ry); ry += 5;
  if (data.partenaire.telephone) { doc.text(`T\u00E9l : ${data.partenaire.telephone}`, rx, ry); ry += 5; }

  // ── Séparateur ───────────────────────────────────────────────────
  const sepY = Math.max(y, ry) + 4;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(14, sepY, W - 14, sepY);

  // ── Tableau détail commission ─────────────────────────────────────
  autoTable(doc, {
    startY: sepY + 6,
    head: [["R\u00E9f. devis", "Client", "Produit(s)", "Prix n\u00E9goci\u00E9", "Prix partenaire", "Commission"]],
    body: [[
      data.devis.numeroDevis,
      data.devis.nomClient,
      data.devis.produits,
      formatPrix(data.devis.prixNegocie),
      formatPrix(data.devis.prixPartenaire),
      formatPrix(data.devis.commission),
    ]],
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 3.5, textColor: DARK, overflow: "linebreak" },
    headStyles: {
      fillColor: ORANGE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: "bold" },
      1: { cellWidth: 30 },
      2: { cellWidth: 55 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", fontStyle: "bold", cellWidth: 28 },
    },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 8;

  // ── Total commission ──────────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.roundedRect(W - 90, afterTable, 76, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("COMMISSION TOTALE :", W - 85, afterTable + 9);
  doc.text(formatPrix(data.devis.commission), W - 14, afterTable + 9, { align: "right" });

  // ── Conditions ───────────────────────────────────────────────────
  const condY = afterTable + 28;
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(14, condY, W - 28, 24, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...ORANGE);
  doc.text("Conditions de r\u00E8glement", 18, condY + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("R\u00E8glement par virement bancaire — coordonn\u00E9es fournies sur demande.", 18, condY + 13.5);
  doc.text("\u00C0 r\u00E9ception de la pr\u00E9sente note de commission.", 18, condY + 19);

  // ── Pied de page ─────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageH - 12, W - 14, pageH - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`Note de commission N\u00B0${data.numeroCommission} \u2014 97import.com / LUXENT LIMITED`, W / 2, pageH - 6, { align: "center" });

  return doc.output("blob");
}
