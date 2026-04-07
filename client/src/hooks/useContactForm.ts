// Hook pour la soumission des formulaires de contact — Firebase v2
import { useState } from "react";
import { adminInsert } from "@/lib/adminQuery";

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
  productId?: string;
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
      const { error: insertError } = await adminInsert("contacts", {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        subject: data.subject ?? null,
        message: data.message,
        source: data.source ?? "contact",
        product_id: data.productId ?? null,
      });

      if (insertError) throw new Error(insertError);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, success, error, submit };
}
