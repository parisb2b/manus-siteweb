import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role?: "admin" | "collaborateur" | "partner" | "vip" | "user";
  prix_negocie?: Record<string, number>;
  created_at: string;
  /** Adresse de facturation (colonnes ajoutées via add-address-columns.sql) */
  adresse_facturation?: string;
  ville_facturation?: string;
  code_postal_facturation?: string;
  pays_facturation?: string;
  /** Adresse de livraison */
  adresse_livraison?: string;
  ville_livraison?: string;
  code_postal_livraison?: string;
  pays_livraison?: string;
  adresse_livraison_identique?: boolean;
};

export type Role = "admin" | "collaborateur" | "partner" | "vip" | "user" | "visitor";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role;
  loading: boolean;
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; phone: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Role computed from profile — never blocks UI rendering
  const role: Role =
    !user
      ? "visitor"
      : (["admin", "collaborateur", "partner", "vip", "user"] as const).includes(profile?.role as any)
      ? (profile!.role as Role)
      : "user";

  // Fetch existing profile — purely non-blocking
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        return null;
      }
      return data as Profile | null;
    } catch {
      return null;
    }
  };

  // For OAuth users (Google, Apple…): upsert profile from metadata if missing
  const ensureProfile = async (u: User) => {
    if (!supabase) return;
    const existing = await fetchProfile(u.id);
    if (existing) {
      setProfile(existing);
      return;
    }
    // New OAuth user — create profile from user_metadata
    const meta = u.user_metadata || {};
    const firstName = (meta.given_name as string) || (meta.full_name as string)?.split(" ")[0] || "";
    const lastName  = (meta.family_name as string) || (meta.full_name as string)?.split(" ").slice(1).join(" ") || "";
    const { data } = await supabase
      .from("profiles")
      .upsert({
        id: u.id,
        first_name: firstName,
        last_name: lastName,
        email: u.email || "",
        phone: (meta.phone as string) || "",
        role: "user",
      })
      .select()
      .maybeSingle();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Safety net — loading never stays true more than 3s
    const loadingTimeout = setTimeout(() => setLoading(false), 3000);

    // Initial session check — loading = false IMMEDIATELY after session resolves
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(loadingTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // ← unblocks UI right away, profile loads in background
      if (session?.user) {
        ensureProfile(session.user).catch(() => {});
      }
    });

    // Real-time auth changes (sign-in, sign-out, token refresh, OAuth callback…)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // always unblock on any auth state change
        if (session?.user) {
          ensureProfile(session.user).catch(() => {});
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone: string }
  ) => {
    if (!supabase) return { error: { message: "Supabase non configuré" } };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin + "/confirmation",
      },
    });

    if (!error && data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        email,
        phone: metadata.phone,
        role: "user",
      });
      if (profileError) { /* silent: profile upsert may fail on race condition */ }
      const p = await fetchProfile(data.user.id);
      setProfile(p);
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: "Supabase non configuré" } };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const resetPasswordForEmail = async (email: string) => {
    if (!supabase) return { error: { message: "Supabase non configuré" } };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
