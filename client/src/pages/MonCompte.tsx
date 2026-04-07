import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User, Phone, Save, Loader2, AlertCircle,
  ShoppingBag, FileText, Shield, ChevronRight, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import ProfileTab from "@/features/account/tabs/ProfileTab";
import OrdersTab from "@/features/account/tabs/OrdersTab";
import QuotesTab from "@/features/account/tabs/QuotesTab";
import CommissionsTab from "@/features/account/tabs/CommissionsTab";
import SecurityTab from "@/features/account/tabs/SecurityTab";

type Tab = "infos" | "commandes" | "devis" | "commissions" | "securite";

const getInitialTab = (): Tab => {
  if (typeof window === "undefined") return "infos";
  const p = window.location.pathname;
  if (p.includes("mes-devis")) return "devis";
  if (p.includes("mes-commandes")) return "commandes";
  if (p.includes("securite")) return "securite";
  if (p.includes("mes-informations")) return "infos";
  return "infos";
};

export default function MonCompte() {
  const [, setLocation] = useLocation();
  const { user, profile, role, loading, setShowAuthModal, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

  // ── Redirection si non connecté ──
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
      setLocation("/");
    }
  }, [user, loading]);

  // ── Helpers prénom / nom ──
  const getFirstName = (): string => {
    if (profile?.first_name) return profile.first_name;
    if (user?.displayName) return user.displayName.split(" ")[0];
    return user?.email || "";
  };

  const getLastName = (): string => {
    if (profile?.last_name) return profile.last_name;
    if (user?.displayName) {
      const parts = user.displayName.split(" ");
      return parts.slice(1).join(" ");
    }
    return "";
  };

  // ── Modal complétion profil obligatoire ──
  const isProfileIncomplete =
    !loading && user && profile !== null && (!profile?.first_name || !profile?.last_name || !profile?.phone);

  const [modalFirstName, setModalFirstName] = useState("");
  const [modalLastName, setModalLastName] = useState("");
  const [modalPhone, setModalPhone] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (isProfileIncomplete) {
      setModalFirstName(getFirstName());
      setModalLastName(getLastName());
      setModalPhone(profile?.phone || "");
    }
  }, [isProfileIncomplete]);

  const handleSaveModal = async () => {
    if (!user) return;
    if (!modalFirstName.trim() || !modalLastName.trim()) {
      setModalError("Prénom et nom sont obligatoires.");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        first_name: modalFirstName.trim(),
        last_name: modalLastName.trim(),
        phone: modalPhone.trim(),
        email: user.email,
        role: profile?.role ?? "user",
      }, { merge: true });
      window.location.reload();
    } catch (err: unknown) {
      setModalError((err as Error).message || "Erreur lors de la sauvegarde.");
      setModalLoading(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "infos",     label: "Mes informations", icon: User },
    { id: "commandes", label: "Mes commandes",    icon: ShoppingBag },
    { id: "devis",     label: "Mes devis",        icon: FileText },
    ...(profile?.role === "partner" ? [{ id: "commissions" as Tab, label: "Mes commissions", icon: ChevronRight }] : []),
    { id: "securite",  label: "Sécurité",         icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />

      {/* ── Modal complétion profil obligatoire (non-closable) ── */}
      {isProfileIncomplete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            <div className="text-center mb-6">
              <div className="bg-[#4A90D9]/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Complétez votre profil</h2>
              <p className="text-gray-500 text-sm mt-2">
                Ces informations sont nécessaires pour accéder à votre espace personnel.
              </p>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 mb-5">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{modalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Prénom *</label>
                  <input
                    type="text"
                    value={modalFirstName}
                    onChange={(e) => setModalFirstName(e.target.value)}
                    placeholder="Jean"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nom *</label>
                  <input
                    type="text"
                    value={modalLastName}
                    onChange={(e) => setModalLastName(e.target.value)}
                    placeholder="Dupont"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="0696 12 34 56"
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900 text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveModal}
                disabled={modalLoading}
                className="w-full h-12 bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold rounded-xl mt-2"
              >
                {modalLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde…</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Enregistrer et accéder à mon espace</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-white py-12 md:py-16 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="bg-[#4A90D9]/10 p-4 rounded-full">
                <User className="h-8 w-8 text-[#4A90D9]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
                  Mon espace
                </h1>
                <p className="text-gray-500 mt-1">
                  Bonjour,{" "}
                  <span className="font-semibold text-[#4A90D9]">
                    {getFirstName()} {getLastName()}
                  </span>
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {profile?.role && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                      profile.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : profile.role === "collaborateur"
                        ? "bg-blue-100 text-blue-700"
                        : profile.role === "partner"
                        ? "bg-orange-100 text-orange-700"
                        : profile.role === "vip"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {profile.role === "admin" ? "Admin"
                        : profile.role === "collaborateur" ? "Collaborateur"
                        : profile.role === "partner" ? "Partenaire"
                        : profile.role === "vip" ? "VIP"
                        : "Utilisateur"}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {user.app_metadata?.provider === "google"
                      ? "Connecté via Google"
                      : "Connecté par email"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold transition-colors text-left border-b border-gray-50 last:border-0 ${
                      activeTab === tab.id
                        ? "bg-[#4A90D9] text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                    {activeTab !== tab.id && (
                      <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Contenu principal */}
          <main className="flex-1">
            {activeTab === "infos" && <ProfileTab user={user} profile={profile} />}
            {activeTab === "commandes" && <OrdersTab user={user} />}
            {activeTab === "devis" && <QuotesTab user={user} profile={profile} role={role} />}
            {activeTab === "commissions" && <CommissionsTab user={user} />}
            {activeTab === "securite" && <SecurityTab />}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
