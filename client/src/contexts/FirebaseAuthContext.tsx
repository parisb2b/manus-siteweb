/**
 * FirebaseAuthContext.tsx — Authentification Firebase pour 97import v2
 * Remplace AuthContext.tsx (Supabase) — interface compatible
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updatePassword,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ── Types ────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role?: "admin" | "collaborateur" | "partner" | "vip" | "user";
  prix_negocie?: Record<string, number>;
  created_at: string;
  adresse_facturation?: string;
  ville_facturation?: string;
  cp_facturation?: string;
  pays_facturation?: string;
  adresse_livraison?: string;
  ville_livraison?: string;
  cp_livraison?: string;
  pays_livraison?: string;
  adresse_livraison_identique?: boolean;
};

/** Type AuthUser compatible avec l'ancien user Supabase (id = uid) */
export type AuthUser = FirebaseUser & {
  /** Alias de uid — compatibilité avec le code existant */
  id: string;
  app_metadata?: {
    provider?: string;
  };
};

export type Role =
  | "admin"
  | "collaborateur"
  | "partner"
  | "vip"
  | "user"
  | "visitor";

const ADMIN_EMAIL = "parisb2b@gmail.com";

// ── Context type ─────────────────────────────────────────────────────────────

type AuthContextType = {
  user: AuthUser | null;
  session: null; // Firebase n'utilise pas de sessions explicites
  profile: Profile | null;
  role: Role;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone: string }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  /** Alias pour compatibilité */
  logOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updateUserPassword: (newPassword: string) => Promise<{ error: any }>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helper : convertit FirebaseUser en AuthUser ───────────────────────────────

function toAuthUser(fbUser: FirebaseUser): AuthUser {
  const provider = fbUser.providerData?.[0]?.providerId ?? "password";
  return Object.assign(Object.create(Object.getPrototypeOf(fbUser)), fbUser, {
    id: fbUser.uid,
    app_metadata: { provider: provider.replace(".com", "").replace("google", "google") },
  }) as AuthUser;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const role: Role =
    !user
      ? "visitor"
      : (
          ["admin", "collaborateur", "partner", "vip", "user"] as const
        ).includes(profile?.role as any)
      ? (profile!.role as Role)
      : "user";

  // Récupère ou crée le profil dans Firestore collection 'users'
  const fetchOrCreateProfile = async (fbUser: FirebaseUser): Promise<Profile | null> => {
    try {
      const ref = doc(db, "users", fbUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as Profile;
      }
      // Nouveau utilisateur — créer le profil
      const isAdmin = fbUser.email === ADMIN_EMAIL;
      const meta = fbUser.providerData?.[0];
      const newProfile: Profile = {
        id: fbUser.uid,
        first_name: fbUser.displayName?.split(" ")[0] || "",
        last_name: fbUser.displayName?.split(" ").slice(1).join(" ") || "",
        email: fbUser.email || "",
        phone: fbUser.phoneNumber || "",
        role: isAdmin ? "admin" : "user",
        created_at: new Date().toISOString(),
      };
      await setDoc(ref, { ...newProfile, created_at: serverTimestamp() });
      return newProfile;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadingTimeout = setTimeout(() => setLoading(false), 4000);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      clearTimeout(loadingTimeout);
      if (fbUser) {
        const authUser = toAuthUser(fbUser);
        setUser(authUser);
        setLoading(false);
        // Charge profil en arrière-plan
        fetchOrCreateProfile(fbUser)
          .then((p) => setProfile(p))
          .catch(() => {});
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  // ── signUp ────────────────────────────────────────────────────────────────

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone: string }
  ) => {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const isAdmin = email === ADMIN_EMAIL;
      const newProfile: Profile = {
        id: fbUser.uid,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
        email,
        phone: metadata.phone,
        role: isAdmin ? "admin" : "user",
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", fbUser.uid), {
        ...newProfile,
        created_at: serverTimestamp(),
      });
      setProfile(newProfile);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // ── signIn ────────────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // ── signInWithGoogle ───────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // ── signOut ───────────────────────────────────────────────────────────────

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem("97import_cart_v2");
    await firebaseSignOut(auth);
    window.location.href = "/";
  };

  // ── resetPasswordForEmail ─────────────────────────────────────────────────

  const resetPasswordForEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  // ── updateUserPassword ────────────────────────────────────────────────────

  const updateUserPassword = async (newPassword: string) => {
    try {
      if (!auth.currentUser) return { error: { message: "Non connecté" } };
      await updatePassword(auth.currentUser, newPassword);
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        logOut: signOut,
        resetPasswordForEmail,
        updateUserPassword,
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
