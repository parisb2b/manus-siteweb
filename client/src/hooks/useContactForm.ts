// Hook pour la soumission des formulaires de contact
// Envoie les données vers Supabase quand configuré, sinon log en développement
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;    // objet / sujet du message (optionnel)
  message: string;
  source?: string;     // page d'origine : "contact", "services", "produit"…
  productId?: string;  // référence produit si applicable
}

interface UseContactFormReturn {
  submitting: boolean;
  success: boolean;
  error: string | null;
  submit: (data: ContactFormData) => Promise<void>;
}

export function useContactForm(): UseContactFormReturn {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: ContactFormData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (supabase) {
        // Insertion dans la table "contacts" via le client Supabase
        const { error: sbError } = await supabase.from("contacts").insert({
          name:       data.name,
          email:      data.email,
          phone:      data.phone      ?? null,
          subject:    data.subject    ?? null,
          message:    data.message,
          source:     data.source     ?? "contact",
          product_id: data.productId  ?? null,  // camelCase → snake_case
        });

        if (sbError) {
          throw new Error(sbError.message || "Erreur Supabase");
        }
      } else {
        // Mode développement sans .env : log console, simule un délai réseau
        console.log("[ContactForm - Dev] Données reçues :", {
          name:       data.name,
          email:      data.email,
          phone:      data.phone      ?? null,
          subject:    data.subject    ?? null,
          message:    data.message,
          source:     data.source     ?? "contact",
          product_id: data.productId  ?? null,
        });
        await new Promise((r) => setTimeout(r, 500));
      }

      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, success, error, submit };
}
