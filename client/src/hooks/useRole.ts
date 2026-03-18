import { useAuth } from "@/contexts/AuthContext";

export type Role = "admin" | "partenaire" | "client" | "visitor";

export function useRole(): { role: Role; loading: boolean } {
  const { role, loading } = useAuth();
  return { role, loading };
}
