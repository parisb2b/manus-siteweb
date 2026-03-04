import ComingSoon from "@/components/ComingSoon";
import { usePageContent } from "@/hooks/useSiteContent";

export default function Agriculture() {
  const { page } = usePageContent("agricole");

  return (
    <ComingSoon
      title={page?.comingSoonTitle || "Page Machines Agricoles en maintenance"}
      description={page?.comingSoonDescription || "Notre gamme de machines agricoles (tracteurs, compacteurs) est en cours de mise à jour pour mieux vous servir. Revenez très bientôt !"}
    />
  );
}
