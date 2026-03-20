import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/utils/calculPrix";

export type { Role };

export function useRole(): { role: Role; loading: boolean } {
  const { role, loading } = useAuth();
  return { role: role as Role, loading };
}
