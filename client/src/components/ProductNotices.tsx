/**
 * ProductNotices — Affiche les liens notice PDF et vidéo d'un produit.
 * - Visitor : boutons désactivés avec message "Connectez-vous"
 * - Connecté (user, partner, vip, admin, collaborateur) : liens actifs
 */

import { FileText, Video, Lock } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";

interface ProductNoticesProps {
  noticeUrl?: string | null;
  videoUrl?: string | null;
  productName?: string;
  className?: string;
}

export default function ProductNotices({
  noticeUrl,
  videoUrl,
  productName,
  className = "",
}: ProductNoticesProps) {
  const { role, loading } = useRole();
  const { setShowAuthModal } = useAuth();

  if (loading || (!noticeUrl && !videoUrl)) return null;

  const isConnected = role !== "visitor";

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        Documentation
      </p>

      {noticeUrl && (
        isConnected ? (
          <a
            href={noticeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#4A90D9] hover:text-[#3A7BC8] font-medium"
          >
            <FileText className="w-4 h-4" />
            Notice d'utilisation (PDF)
          </a>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-500"
          >
            <Lock className="w-4 h-4" />
            Notice — connectez-vous pour accéder
          </button>
        )
      )}

      {videoUrl && (
        isConnected ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#4A90D9] hover:text-[#3A7BC8] font-medium"
          >
            <Video className="w-4 h-4" />
            Vidéo de présentation
          </a>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-500"
          >
            <Lock className="w-4 h-4" />
            Vidéo — connectez-vous pour accéder
          </button>
        )
      )}
    </div>
  );
}
