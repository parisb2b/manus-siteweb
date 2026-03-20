import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function pdfEur(n: number): string {
  const parts = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts + " EUR";
}

export interface FactureData {
  numeroFacture: string;
  dateFacture: string;
  dateDevis?: string;
  numeroDevis?: string;
  client: {
    nom: string;
    adresse: string;
    ville: string;
    pays: string;
    email: string;
    telephone?: string;
  };
  produits: Array<{
    nom: string;
    description?: string;
    prixUnitaire: number;
    quantite: number;
    total: number;
  }>;
  totalHT: number;
}

const PRIMARY = [74, 144, 217] as [number, number, number];
const DARK    = [26, 26, 46] as [number, number, number];
const GRAY    = [100, 100, 100] as [number, number, number];
const LIGHT   = [245, 245, 245] as [number, number, number];
const GREEN   = [16, 150, 72] as [number, number, number];

function addPage1(doc: jsPDF, data: FactureData) {
  const W = doc.internal.pageSize.getWidth();

  // ── Header strip ──────────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`Facture ${data.numeroFacture}`, 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 240, 210);
  doc.text(`Date : ${data.dateFacture}`, 14, 20);
  if (data.numeroDevis) {
    doc.text(`Réf. devis : ${data.numeroDevis}`, 14, 25);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("97import.com", W - 14, 12, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 240, 210);
  doc.text("Importation & Distribution", W - 14, 20, { align: "right" });

  // ── Bloc émetteur (gauche) ────────────────────────────────────────
  let y = 38;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("ÉMETTEUR", 14, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("LUXENT LIMITED", 14, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const emetteurLines = [
    "2ND FLOOR COLLEGE HOUSE",
    "17 KING EDWARDS ROAD RUISLIP",
    "HA4 7AE LONDON, Royaume-Uni",
    "N° entreprise : 14852122",
    "Email : luxent@ltd-uk.eu",
  ];
  emetteurLines.forEach((line) => {
    doc.text(line, 14, y);
    y += 5;
  });

  // ── Bloc destinataire (droite) ────────────────────────────────────
  const rx = W / 2 + 5;
  let ry = 38;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("DESTINATAIRE", rx, ry);

  ry += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(data.client.nom, rx, ry);

  ry += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const clientLines: string[] = [];
  if (data.client.adresse) clientLines.push(data.client.adresse);
  if (data.client.ville) clientLines.push(data.client.ville);
  if (data.client.pays) clientLines.push(data.client.pays);
  clientLines.push(`Email : ${data.client.email}`);
  if (data.client.telephone) clientLines.push(`Tél : ${data.client.telephone}`);
  clientLines.forEach((line) => {
    doc.text(line, rx, ry);
    ry += 5;
  });

  // ── Séparateur ───────────────────────────────────────────────────
  const sepY = Math.max(y, ry) + 4;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.line(14, sepY, W - 14, sepY);

  // ── Tableau produits ─────────────────────────────────────────────
  const tableY = sepY + 6;

  const rows = data.produits.map((p) => [
    p.nom,
    p.description || p.nom,
    pdfEur(p.prixUnitaire),
    String(p.quantite),
    pdfEur(p.total),
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [["Désignation", "Description", "Prix HT", "Qté", "Total HT"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 3, textColor: DARK, overflow: "linebreak" },
    headStyles: {
      fillColor: GREEN,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8.5,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 48 },
      1: { cellWidth: 62 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", fontStyle: "bold", cellWidth: 30 },
    },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.2,
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // ── Ligne Total ───────────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.roundedRect(W - 85, afterTable, 71, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL HT :", W - 80, afterTable + 9);
  doc.text(pdfEur(data.totalHT), W - 14, afterTable + 9, { align: "right" });

  // ── Date de paiement ─────────────────────────────────────────────
  const mentionY = afterTable + 22;
  doc.setFillColor(240, 255, 245);
  doc.roundedRect(14, mentionY, W - 28, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GREEN);
  doc.text("Date de paiement : À réception de la présente facture", 14 + 4, mentionY + 6.5);

  // ── Mention TVA ───────────────────────────────────────────────────
  const tvaY = mentionY + 14;
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(14, tvaY, W - 28, 10, 2, 2, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 100, 30);
  doc.text("TVA non applicable, art. 293 B du CGI", 14 + 4, tvaY + 6.5);

  // ── Pied de page ─────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageH - 12, W - 14, pageH - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`Facture ${data.numeroFacture} — 97import.com / LUXENT LIMITED`, W / 2, pageH - 6, { align: "center" });
}

function addPage2(doc: jsPDF, data: FactureData) {
  doc.addPage();
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("Conditions de règlement", 14, 12);

  let y = 30;

  const sectionTitle = (title: string) => {
    doc.setFillColor(...GREEN);
    doc.roundedRect(14, y, W - 28, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 18, y + 5.5);
    y += 13;
  };

  const bodyText = (lines: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    lines.forEach((line) => {
      doc.text(line, 18, y);
      y += 5.5;
    });
    y += 4;
  };

  sectionTitle("Conditions de règlement");
  bodyText(["À réception de la facture."]);

  sectionTitle("Mode de règlement");
  bodyText([
    "Virement bancaire :",
    "IBAN : à confirmer par email à luxent@ltd-uk.eu",
    "Référence à mentionner : " + data.numeroFacture,
  ]);

  sectionTitle("Informations légales");
  bodyText([
    "LUXENT LIMITED — N° entreprise 14852122",
    "2nd Floor College House, 17 King Edwards Road Ruislip, HA4 7AE London, UK",
    "Email : luxent@ltd-uk.eu",
  ]);

  if (data.numeroDevis) {
    sectionTitle("Référence devis");
    bodyText([`Cette facture fait suite au devis ${data.numeroDevis} du ${data.dateDevis || "—"}.`]);
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageH - 12, W - 14, pageH - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`Facture N° ${data.numeroFacture} — 97import.com`, 14, pageH - 6);
  doc.text("Page 2 / 2", W - 14, pageH - 6, { align: "right" });
}

export function generateFacturePDF(data: FactureData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  addPage1(doc, data);
  addPage2(doc, data);
  return doc.output("blob");
}
