export type Role = "visitor" | "user" | "vip" | "partner" | "collaborateur" | "admin";

export interface PrixResult {
  prixAffiche: number | null;
  label: string;
  prixReference?: number;
  prixAchat?: number;
  prixUtilisateur?: number;
  prixPartenaire?: number;
}

export function calculerPrix(prixAchat: number, role: Role, prixNegocie?: number): PrixResult {
  switch (role) {
    case "admin":
      return {
        prixAffiche: prixAchat,
        label: "Prix achat",
        prixAchat,
        prixUtilisateur: Math.round(prixAchat * 1.5),
        prixPartenaire: Math.round(prixAchat * 1.2),
      };
    case "collaborateur":
      return {
        prixAffiche: prixAchat,
        label: "Prix achat",
        prixAchat,
        prixUtilisateur: Math.round(prixAchat * 1.5),
        prixPartenaire: Math.round(prixAchat * 1.2),
      };
    case "partner":
      return {
        prixAffiche: Math.round(prixAchat * 1.2),
        label: "Prix partenaire HT",
        prixReference: Math.round(prixAchat * 1.5),
      };
    case "vip":
      return {
        prixAffiche: prixNegocie ?? Math.round(prixAchat * 1.3),
        label: "Votre prix négocié HT",
      };
    case "user":
      return {
        prixAffiche: Math.round(prixAchat * 1.5),
        label: "Prix HT",
      };
    default:
      return { prixAffiche: null, label: "" };
  }
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
