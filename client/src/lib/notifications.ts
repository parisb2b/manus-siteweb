/**
 * notifications.ts — Service d'envoi de notifications email
 * Utilise Supabase Edge Functions pour l'envoi d'email
 * Si la fonction n'existe pas encore, log en console et retourne false
 */

import { supabase } from "./supabase";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  attachmentUrl?: string;
  attachmentName?: string;
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
  const body = `
Bonjour ${opts.nomClient},

Votre ${opts.typeDocument.toLowerCase()} ${opts.numeroDocument} est disponible.

${opts.pdfUrl ? `Télécharger le document : ${opts.pdfUrl}` : "Le document est disponible dans votre espace client sur 97import.com."}

Cordialement,
L'équipe 97 import
contact@97import.com
`.trim();

  return sendEmail({
    to: opts.email,
    subject,
    body,
    attachmentUrl: opts.pdfUrl,
    attachmentName: `${opts.typeDocument}_${opts.numeroDocument}.pdf`,
  });
}
