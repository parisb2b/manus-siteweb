import { Link } from "wouter";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";

interface PrixOuDevisProps {
  prix: string;
  /** Mode compact pour affichage inline (ex: tableaux d'accessoires) */
  compact?: boolean;
}

export default function PrixOuDevis({ prix, compact = false }: PrixOuDevisProps) {
  const { role, loading } = useRole();
  const { setShowAuthModal } = useAuth();

  if (loading) {
    return <span className="text-gray-300 animate-pulse">…</span>;
  }

  if (role === "admin" || role === "partenaire") {
    return <span className={compact ? "font-bold text-[#4A90D9]" : "text-4xl font-bold text-[#4A90D9]"}>{prix}</span>;
  }

  if (role === "client") {
    return (
      <Link href="/contact">
        <span
          className={
            compact
              ? "text-xs font-bold text-white bg-[#4A90D9] px-2 py-1 rounded-lg cursor-pointer hover:bg-[#3A7BC8] transition-colors whitespace-nowrap"
              : "inline-block text-base font-bold text-white bg-[#4A90D9] px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#3A7BC8] transition-colors"
          }
        >
          {compact ? "Devis" : "Demander un devis"}
        </span>
      </Link>
    );
  }

  // visitor
  return (
    <button
      onClick={() => setShowAuthModal(true)}
      className={
        compact
          ? "text-xs font-bold text-[#4A90D9] border border-[#4A90D9] px-2 py-1 rounded-lg hover:bg-[#4A90D9] hover:text-white transition-colors whitespace-nowrap"
          : "text-base font-bold text-[#4A90D9] border-2 border-[#4A90D9] px-5 py-2.5 rounded-xl hover:bg-[#4A90D9] hover:text-white transition-colors"
      }
    >
      {compact ? "Connexion" : "Se connecter pour un devis"}
    </button>
  );
}
