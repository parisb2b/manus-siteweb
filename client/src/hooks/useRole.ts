import { useAuth } from "@/contexts/AuthContext";

export type Role = "admin" | "partenaire" | "client" | "visitor";

export function useRole(): { role: Role; loading: boolean } {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return { role: "visitor", loading: true };
  }

  if (!user) {
    return { role: "visitor", loading: false };
  }

  const r = profile?.role;
  if (r === "admin" || r === "partenaire" || r === "client") {
    return { role: r, loading: false };
  }

  // Authenticated but no role set → default client
  return { role: "client", loading: false };
}
