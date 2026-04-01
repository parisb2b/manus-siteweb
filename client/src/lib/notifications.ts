/**
 * notifications.ts — Service d'envoi de notifications email
 * Utilise Supabase Edge Function "send-email" (Resend API)
 * Supporte body texte OU html riche
 */

import { supabase } from "./supabase";

export interface EmailPayload {
  to: string;
  subject: string;
  body?: string;
  html?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}

/* ─── Template HTML réutilisable ─── */
function wrapHtmlEmail(contenu: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:Inter,Arial,sans-serif;color:#374151;margin:0;padding:0}
  .container{max-width:560px;margin:0 auto;padding:32px 24px}
  .header{background:#1E3A5F;padding:20px 24px;border-radius:8px 8px 0 0}
  .header h1{color:#fff;font-size:18px;margin:0}
  .header p{color:#93C5FD;font-size:13px;margin:4px 0 0}
  .body{background:#fff;border:0.5px solid #E5E7EB;padding:24px;border-radius:0 0 8px 8px}
  .doc-badge{background:#EFF6FF;border:0.5px solid #BFDBFE;border-radius:6px;padding:12px 16px;margin:16px 0;color:#1E3A5F;font-weight:600}
  .btn{display:inline-block;background:#1E3A5F;color:#fff!important;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;margin-top:16px}
  .footer{text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF}
</style></head>
<body><div class="container">
  <div class="header">
    <h1>97import.com</h1>
    <p>Importation &amp; Distribution DOM-TOM</p>
  </div>
  <div class="body">
    ${contenu}
    <a href="https://97import.com/mon-compte.html" class="btn">Accéder à mon espace →</a>
    <p style="margin-top:24px;font-size:12px;color:#6B7280;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  </div>
  <div class="footer">97import.com — Importation DOM-TOM<br/>
    <a href="mailto:parisb2b@gmail.com" style="color:#9CA3AF;">parisb2b@gmail.com</a>
  </div>
</div></body></html>`;
}

/**
 * Envoyer un email via Supabase Edge Function "send-email"
 * Retourne true si envoyé, false sinon
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!supabase) {
    console.warn("[notifications] Supabase non configuré");
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: payload,
    });

    if (error) {
      console.warn("[notifications] Erreur Edge Function:", error.message);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.warn("[notifications] Edge Function non disponible:", err);
    return false;
  }
}

/**
 * Envoyer une notification de document (facture, devis, BL, etc.)
 */
export async function sendDocumentNotification(opts: {
  email: string;
  nomClient: string;
  typeDocument: string;
  numeroDocument: string;
  pdfUrl?: string;
}): Promise<boolean> {
  const subject = `97import.com — ${opts.typeDocument} ${opts.numeroDocument}`;
  const html = wrapHtmlEmail(`
    <p>Bonjour ${opts.nomClient},</p>
    <p>Un nouveau document est disponible dans votre espace client :</p>
    <div class="doc-badge">📄 ${opts.typeDocument} ${opts.numeroDocument}</div>
    <p>Connectez-vous à votre espace pour le consulter et le télécharger.</p>
  `);

  return sendEmail({ to: opts.email, subject, html });
}

/**
 * Notification d'acompte encaissé
 */
export async function sendAcompteNotification(opts: {
  email: string;
  nomClient: string;
  montant: number;
  numeroDevis: string;
}): Promise<boolean> {
  const subject = `Acompte reçu — Facture mise à jour — 97import.com`;
  const html = wrapHtmlEmail(`
    <p>Bonjour ${opts.nomClient},</p>
    <p>Nous avons bien reçu votre acompte de <strong>${opts.montant.toFixed(2)} €</strong> pour le devis <strong>${opts.numeroDevis}</strong>.</p>
    <div class="doc-badge">💰 Acompte encaissé — Facture mise à jour</div>
    <p>Votre facture a été mise à jour et est disponible dans votre espace client.</p>
  `);

  return sendEmail({ to: opts.email, subject, html });
}

/**
 * Envoyer les liens de notices produits après paiement final (solde)
 */
export async function sendNoticeLinks(opts: {
  email: string;
  nomClient: string;
  numeroDevis: string;
  produits: { nom: string; noticeUrl?: string; videoUrl?: string }[];
}): Promise<boolean> {
  const produitsAvecNotice = opts.produits.filter(
    (p) => p.noticeUrl || p.videoUrl,
  );
  if (produitsAvecNotice.length === 0) return true;

  const lignesHtml = produitsAvecNotice
    .map((p) => {
      let html = `<li><strong>${p.nom}</strong>`;
      if (p.noticeUrl) html += `<br/><a href="${p.noticeUrl}">📋 Notice PDF</a>`;
      if (p.videoUrl) html += `<br/><a href="${p.videoUrl}">🎬 Vidéo</a>`;
      html += `</li>`;
      return html;
    })
    .join("\n");

  const subject = `97import.com — Notices de vos produits (${opts.numeroDevis})`;
  const html = wrapHtmlEmail(`
    <p>Bonjour ${opts.nomClient},</p>
    <p>Suite au règlement complet de votre commande <strong>${opts.numeroDevis}</strong>, voici la documentation de vos produits :</p>
    <ul>${lignesHtml}</ul>
    <p>Ces documents sont également disponibles dans votre espace client.</p>
  `);

  return sendEmail({ to: opts.email, subject, html });
}

/* ─── Templates d'emails prêts à l'emploi ─── */
export const emailTemplates = {
  documentDisponible: (nomDoc: string, nomClient: string) => ({
    subject: `Votre ${nomDoc} est disponible — 97import.com`,
    nomDocument: nomDoc,
    nomClient,
  }),
  devisVip: (nomClient: string) => ({
    subject: "Votre devis remisé VIP est disponible — 97import.com",
    nomDocument: "Devis VIP remisé",
    nomClient,
  }),
  acompteEncaisse: (montant: number, nomClient: string) => ({
    subject: "Acompte reçu — Facture mise à jour — 97import.com",
    nomDocument: `Facture mise à jour (acompte ${montant}€ encaissé)`,
    nomClient,
  }),
  soldeComplet: (nomClient: string) => ({
    subject: "Règlement complet — Notices techniques disponibles",
    nomDocument: "Règlement complet + Notices techniques",
    nomClient,
  }),
};
