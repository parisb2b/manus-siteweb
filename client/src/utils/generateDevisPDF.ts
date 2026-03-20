import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatEur } from "./calculPrix";

export interface DevisData {
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
  produits: Array<{
    nom: string;
    description?: string;
    prixUnitaire: number;
    quantite: number;
    total: number;
  }>;
  totalHT: number;
  role: string;
}

const PRIMARY = [74, 144, 217] as [number, number, number]; // #4A90D9
const DARK    = [26, 26, 46] as [number, number, number];   // #1A1A2E
const GRAY    = [100, 100, 100] as [number, number, number];
const LIGHT   = [245, 245, 245] as [number, number, number];

function addPage1(doc: jsPDF, data: DevisData) {
  const W = doc.internal.pageSize.getWidth();

  // ── Header strip ──────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 28, "F");

  // Titre devis (gauche)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(`Devis ${data.numeroDevis}`, 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 230);
  doc.text(`Date : ${data.date}`, 14, 20);

  // Logo (droite)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.text("97import.com", W - 14, 12, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.setFont("helvetica", "normal");
  doc.text("Importation & Distribution", W - 14, 20, { align: "right" });

  // ── Bloc émetteur (gauche) ────────────────────────────────────────
  let y = 38;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
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
  doc.setTextColor(...PRIMARY);
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
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(14, sepY, W - 14, sepY);

  // ── Tableau produits ─────────────────────────────────────────────
  const tableY = sepY + 6;

  const rows = data.produits.map((p) => [
    p.nom,
    p.description || "—",
    formatEur(p.prixUnitaire),
    String(p.quantite),
    formatEur(p.total),
  ]);

  (doc as any).autoTable({
    startY: tableY,
    head: [["Désignation", "Description", "Prix unitaire HT", "Qté", "Total HT"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3.5, textColor: DARK },
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { halign: "right" },
      3: { halign: "center" },
      4: { halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.2,
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // ── Ligne Total ───────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.roundedRect(W - 85, afterTable, 71, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL HT :", W - 80, afterTable + 9);
  doc.text(formatEur(data.totalHT), W - 14, afterTable + 9, { align: "right" });

  // ── Mention TVA ───────────────────────────────────────────────────
  const mentionY = afterTable + 22;
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(14, mentionY, W - 28, 10, 2, 2, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 100, 30);
  doc.text("TVA non applicable, art. 293 B du CGI", 14 + 4, mentionY + 6.5);

  // ── Pied de page page 1 ───────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`Devis ${data.numeroDevis} — 97import.com / LUXENT LIMITED`, W / 2, pageH - 8, { align: "center" });
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageH - 12, W - 14, pageH - 12);
}

function addPage2(doc: jsPDF, data: DevisData) {
  doc.addPage();
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Header strip ──────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("Conditions générales & Bon pour accord", 14, 12);

  // ── Conditions ────────────────────────────────────────────────────
  let y = 30;

  const sectionTitle = (title: string) => {
    doc.setFillColor(...PRIMARY);
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
  bodyText(["Virement bancaire — coordonnées fournies sur la facture."]);

  sectionTitle("Livraison");
  bodyText([
    "Les délais de livraison sont donnés à titre indicatif.",
    "Frais de livraison et douane non inclus dans ce devis, calculés séparément.",
  ]);

  sectionTitle("Validité");
  bodyText([`Ce devis est valable 30 jours à compter du ${data.date}.`]);

  // ── Bon pour accord ───────────────────────────────────────────────
  y += 4;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(14, y, W - 28, 85, 3, 3, "F");
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, y, W - 28, 85, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Bon pour accord", W / 2, y + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    "En signant ce devis, le client accepte les conditions générales de vente et le montant ci-dessus.",
    W / 2, y + 18, { align: "center", maxWidth: W - 50 }
  );

  const fieldY = y + 30;
  const fieldW = (W - 28 - 10) / 2;

  // Champ lieu
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text("Fait à :", 18, fieldY);
  doc.setDrawColor(180, 180, 180);
  doc.line(18, fieldY + 10, 18 + fieldW - 4, fieldY + 10);

  // Champ date
  doc.text("Le :", 18 + fieldW + 6, fieldY);
  doc.line(18 + fieldW + 6, fieldY + 10, 18 + fieldW * 2 + 6, fieldY + 10);

  // Signature
  const sigY = fieldY + 20;
  doc.text("Signature :", 18, sigY);
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(18, sigY + 4, fieldW - 4, 22, 1.5, 1.5, "FD");

  // Qualité
  doc.text("Qualité du signataire :", 18 + fieldW + 6, sigY);
  doc.line(18 + fieldW + 6, sigY + 14, 18 + fieldW * 2 + 6, sigY + 14);
  doc.line(18 + fieldW + 6, sigY + 26, 18 + fieldW * 2 + 6, sigY + 26);

  // ── Pied de page page 2 ───────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageH - 12, W - 14, pageH - 12);
  doc.text(`Devis N° ${data.numeroDevis} — 97import.com`, 14, pageH - 6);
  doc.text("Page 2 / 2", W - 14, pageH - 6, { align: "right" });
}

export function generateDevisPDF(data: DevisData): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  addPage1(doc, data);
  addPage2(doc, data);

  return doc.output("blob");
}
