import { Link } from "wouter";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { calculerPrix, formatEur } from "@/utils/calculPrix";

interface PrixOuDevisProps {
  prixAchat: number;
  prixNegocie?: number;
  /** Mode compact pour affichage inline (ex: tableaux d'accessoires) */
  compact?: boolean;
  className?: string;
}

const MSG_LIVRAISON = "Livraison DOM-TOM : contactez notre partenaire logistique";

export default function PrixOuDevis({
  prixAchat,
  prixNegocie,
  compact = false,
  className = "",
}: PrixOuDevisProps) {
  const { role, loading } = useRole();
  const { setShowAuthModal } = useAuth();

  if (loading) {
    return <span className="text-gray-300 animate-pulse">…</span>;
  }

  const result = calculerPrix(prixAchat, role, prixNegocie);

  // ── VISITOR ────────────────────────────────────────────────────────────────
  if (role === "visitor") {
    return (
      <button
        onClick={() => setShowAuthModal(true)}
        className={
          compact
            ? `text-xs font-bold text-[#4A90D9] border border-[#4A90D9] px-2 py-1 rounded-lg hover:bg-[#4A90D9] hover:text-white transition-colors whitespace-nowrap ${className}`
            : `text-base font-bold text-[#4A90D9] border-2 border-[#4A90D9] px-5 py-2.5 rounded-xl hover:bg-[#4A90D9] hover:text-white transition-colors ${className}`
        }
      >
        {compact ? "Connexion" : "Se connecter pour voir les prix"}
      </button>
    );
  }

  // ── ADMIN / COLLABORATEUR ──────────────────────────────────────────────────
  if (role === "admin" || role === "collaborateur") {
    if (compact) {
      return (
        <span className={`font-bold text-[#4A90D9] ${className}`}>
          Achat {formatEur(result.prixAchat!)} · Public {formatEur(result.prixUtilisateur!)}
        </span>
      );
    }
    return (
      <div className={className}>
        <div className="text-sm text-gray-500 space-y-1 mb-1">
          <div>
            <span className="font-semibold text-gray-700">Achat&nbsp;:</span>{" "}
            <span className="font-bold text-emerald-600">{formatEur(result.prixAchat!)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Public (×1.5)&nbsp;:</span>{" "}
            <span className="font-bold text-[#4A90D9]">{formatEur(result.prixUtilisateur!)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Partenaire (×1.2)&nbsp;:</span>{" "}
            <span className="font-bold text-orange-500">{formatEur(result.prixPartenaire!)}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">{MSG_LIVRAISON}</p>
      </div>
    );
  }

  // ── PARTNER ────────────────────────────────────────────────────────────────
  if (role === "partner") {
    if (compact) {
      return (
        <span className={`font-bold text-orange-500 ${className}`}>
          {formatEur(result.prixAffiche!)}
        </span>
      );
    }
    return (
      <div className={className}>
        <div className="text-4xl font-bold text-orange-500 mb-1">
          {formatEur(result.prixAffiche!)}
        </div>
        <div className="text-xs text-gray-400">{result.label}</div>
        <div className="text-xs text-gray-400 line-through mt-0.5">
          Prix public : {formatEur(result.prixReference!)}
        </div>
        <p className="text-xs text-gray-400 mt-2">{MSG_LIVRAISON}</p>
      </div>
    );
  }

  // ── VIP ────────────────────────────────────────────────────────────────────
  if (role === "vip") {
    if (compact) {
      return (
        <span className={`font-bold text-purple-600 ${className}`}>
          {formatEur(result.prixAffiche!)}
        </span>
      );
    }
    return (
      <div className={className}>
        <div className="text-4xl font-bold text-purple-600 mb-1">
          {formatEur(result.prixAffiche!)}
        </div>
        <div className="text-xs text-purple-400">{result.label}</div>
        <p className="text-xs text-gray-400 mt-2">{MSG_LIVRAISON}</p>
      </div>
    );
  }

  // ── USER (connecté, prix public × 1.5) ────────────────────────────────────
  if (role === "user") {
    if (compact) {
      return (
        <span className={`font-bold text-[#4A90D9] ${className}`}>
          {formatEur(result.prixAffiche!)}
        </span>
      );
    }
    return (
      <div className={className}>
        <div className="text-4xl font-bold text-[#4A90D9] mb-1">
          {formatEur(result.prixAffiche!)}
        </div>
        <div className="text-xs text-gray-400">{result.label} — hors livraison et dédouanement</div>
        <p className="text-xs text-gray-400 mt-2">{MSG_LIVRAISON}</p>
      </div>
    );
  }

  // fallback: demande de devis
  return (
    <Link href="/contact">
      <span className={compact
        ? `text-xs font-bold text-white bg-[#4A90D9] px-2 py-1 rounded-lg cursor-pointer hover:bg-[#3A7BC8] transition-colors whitespace-nowrap ${className}`
        : `inline-block text-base font-bold text-white bg-[#4A90D9] px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#3A7BC8] transition-colors ${className}`
      }>
        {compact ? "Devis" : "Demander un devis"}
      </span>
    </Link>
  );
}
