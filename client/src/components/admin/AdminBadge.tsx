const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  // Statuts devis
  nouveau:           { bg: "bg-gray-100",    text: "text-gray-700",    label: "Nouveau" },
  en_cours:          { bg: "bg-blue-100",    text: "text-blue-700",    label: "En cours" },
  negociation:       { bg: "bg-amber-100",   text: "text-amber-700",   label: "Négociation" },
  accepte:           { bg: "bg-emerald-100", text: "text-emerald-700", label: "Accepté" },
  refuse:            { bg: "bg-red-100",     text: "text-red-700",     label: "Refusé" },
  non_conforme:      { bg: "bg-red-200",     text: "text-red-800",     label: "Non conforme" },
  // Statuts paiement
  en_attente:        { bg: "bg-gray-100",    text: "text-gray-600",    label: "En attente" },
  acompte_declare:   { bg: "bg-orange-100",  text: "text-orange-700",  label: "Acompte déclaré" },
  acompte_encaisse:  { bg: "bg-emerald-100", text: "text-emerald-700", label: "Acompte encaissé" },
  paye:              { bg: "bg-emerald-200", text: "text-emerald-800", label: "Payé" },
  // Statuts facture
  emise:             { bg: "bg-blue-100",    text: "text-blue-700",    label: "Émise" },
  payee:             { bg: "bg-emerald-100", text: "text-emerald-700", label: "Payée" },
  annulee:           { bg: "bg-red-100",     text: "text-red-700",     label: "Annulée" },
  // Rôles
  admin:             { bg: "bg-purple-100",  text: "text-purple-700",  label: "Admin" },
  collaborateur:     { bg: "bg-indigo-100",  text: "text-indigo-700",  label: "Collaborateur" },
  vip:               { bg: "bg-amber-100",   text: "text-amber-700",   label: "VIP" },
  partner:           { bg: "bg-blue-100",    text: "text-blue-700",    label: "Partenaire" },
  partenaire:        { bg: "bg-blue-100",    text: "text-blue-700",    label: "Partenaire" },
  user:              { bg: "bg-gray-100",    text: "text-gray-600",    label: "Client" },
  client:            { bg: "bg-gray-100",    text: "text-gray-600",    label: "Client" },
  // Partenaire statut
  actif:             { bg: "bg-emerald-100", text: "text-emerald-700", label: "Actif" },
  inactif:           { bg: "bg-gray-100",    text: "text-gray-500",    label: "Inactif" },
};

interface AdminBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
}

export default function AdminBadge({ status, label, size = "sm" }: AdminBadgeProps) {
  const style = STATUS_STYLES[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };
  const displayLabel = label || style.label;

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${style.bg} ${style.text} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      }`}
    >
      {displayLabel}
    </span>
  );
}
