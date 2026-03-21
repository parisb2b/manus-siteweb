import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  Save, Loader2, CheckCircle2, AlertCircle,
  ShoppingBag, FileText, Shield, ChevronRight, LogOut, Download,
} from "lucide-react";
import { generateDevisPDF, type DevisData } from "@/utils/generateDevisPDF";
import { generateFacturePDF, type FactureData } from "@/utils/generateFacturePDF";
import { formatEur } from "@/utils/calculPrix";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Tab = "infos" | "commandes" | "devis" | "commissions" | "securite";

type Commande = {
  id: string;
  created_at: string;
  product_name?: string;
  amount?: number;
  status?: string;
};

type Devis = {
  id: string;
  created_at: string;
  numero_devis?: string;
  produits?: any[];
  prix_total_calcule?: number;
  prix_negocie?: number;
  statut: string;
  facture_generee?: boolean;
  adresse_client?: string;
  ville_client?: string;
};

export default function MonCompte() {
  const [, setLocation] = useLocation();
  const { user, profile, role, loading, setShowAuthModal, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("infos");

  // ── Redirection si non connecté ─────────────────────────────────
  // loading=false vient d'AuthContext dès que la session est résolue (max 3s)
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
      setLocation("/");
    }
  }, [user, loading]);

  // ── Helpers prénom / nom ─────────────────────────────────────────
  const getFirstName = (): string => {
    if (profile?.first_name) return profile.first_name;
    const meta = user?.user_metadata;
    if (meta?.given_name) return meta.given_name as string;
    if (meta?.full_name) return (meta.full_name as string).split(" ")[0];
    return user?.email || "";
  };

  const getLastName = (): string => {
    if (profile?.last_name) return profile.last_name;
    const meta = user?.user_metadata;
    if (meta?.family_name) return meta.family_name as string;
    if (meta?.full_name) {
      const parts = (meta.full_name as string).split(" ");
      return parts.slice(1).join(" ");
    }
    return "";
  };

  // ── Modal complétion profil obligatoire ─────────────────────────
  // Affiche seulement si profil chargé (non-null) et incomplet
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
    if (!supabase || !user) return;
    if (!modalFirstName.trim() || !modalLastName.trim()) {
      setModalError("Prénom et nom sont obligatoires.");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: modalFirstName.trim(),
        last_name: modalLastName.trim(),
        phone: modalPhone.trim(),
        email: user.email,
        role: profile?.role ?? "user",
      });
      if (error) throw error;
      // Reload the page to refresh profile from AuthContext
      window.location.reload();
    } catch (err: unknown) {
      setModalError((err as Error).message || "Erreur lors de la sauvegarde.");
      setModalLoading(false);
    }
  };

  // ── Onglet 1 : Mes informations ──────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Adresse facturation
  const [adresseFactEditing, setAdresseFactEditing] = useState(false);
  const [adresseFact, setAdresseFact] = useState("");
  const [villeFact, setVilleFact] = useState("");
  const [cpFact, setCpFact] = useState("");
  const [paysFact, setPaysFact] = useState("France");
  const [adresseFactLoading, setAdresseFactLoading] = useState(false);
  const [adresseFactSuccess, setAdresseFactSuccess] = useState(false);

  // Adresse livraison
  const [livIdent, setLivIdent] = useState(true);
  const [adresseLivEditing, setAdresseLivEditing] = useState(false);
  const [adresseLiv, setAdresseLiv] = useState("");
  const [villeLiv, setVilleLiv] = useState("");
  const [cpLiv, setCpLiv] = useState("");
  const [paysLiv, setPaysLiv] = useState("France");
  const [adresseLivLoading, setAdresseLivLoading] = useState(false);
  const [adresseLivSuccess, setAdresseLivSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setAdresseFact(profile.adresse_facturation || "");
      setVilleFact(profile.ville_facturation || "");
      setCpFact(profile.code_postal_facturation || "");
      setPaysFact(profile.pays_facturation || "France");
      setLivIdent(profile.adresse_livraison_identique ?? true);
      setAdresseLiv(profile.adresse_livraison || "");
      setVilleLiv(profile.ville_livraison || "");
      setCpLiv(profile.code_postal_livraison || "");
      setPaysLiv(profile.pays_livraison || "France");
    }
  }, [profile]);

  const handleSaveAdresseFact = async () => {
    if (!supabase || !user) return;
    setAdresseFactLoading(true);
    await supabase.from("profiles").update({
      adresse_facturation: adresseFact,
      ville_facturation: villeFact,
      code_postal_facturation: cpFact,
      pays_facturation: paysFact,
    }).eq("id", user.id);
    setAdresseFactLoading(false);
    setAdresseFactSuccess(true);
    setAdresseFactEditing(false);
    setTimeout(() => setAdresseFactSuccess(false), 3000);
  };

  const handleSaveAdresseLiv = async () => {
    if (!supabase || !user) return;
    setAdresseLivLoading(true);
    await supabase.from("profiles").update({
      adresse_livraison_identique: livIdent,
      adresse_livraison: livIdent ? adresseFact : adresseLiv,
      ville_livraison: livIdent ? villeFact : villeLiv,
      code_postal_livraison: livIdent ? cpFact : cpLiv,
      pays_livraison: livIdent ? paysFact : paysLiv,
    }).eq("id", user.id);
    setAdresseLivLoading(false);
    setAdresseLivSuccess(true);
    setAdresseLivEditing(false);
    setTimeout(() => setAdresseLivSuccess(false), 3000);
  };

  const handleSaveInfos = async () => {
    if (!supabase || !user) return;
    setInfoLoading(true);
    setInfoError(null);
    setInfoSuccess(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName, phone })
        .eq("id", user.id);
      if (error) throw error;
      setInfoSuccess(true);
      setEditMode(false);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch (err: unknown) {
      setInfoError((err as Error).message || "Erreur lors de la sauvegarde");
    } finally {
      setInfoLoading(false);
    }
  };

  // ── Onglet 2 : Historique commandes ─────────────────────────────
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [commandesLoading, setCommandesLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "commandes" || !supabase || !user) return;
    setCommandesLoading(true);
    // Commandes = devis acceptés (statut "accepte")
    supabase
      .from("quotes")
      .select("id,created_at,numero_devis,produits,prix_negocie,prix_total_calcule,statut,facture_generee,adresse_client,ville_client")
      .eq("user_id", user.id)
      .eq("statut", "accepte")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error("Commandes error:", error); setCommandes([]); }
        else { setCommandes((data as any[]) || []); }
        setCommandesLoading(false);
      });
  }, [activeTab, user]);

  // ── Onglet 3 : Mes devis ─────────────────────────────────────────
  const [devis, setDevis] = useState<Devis[]>([]);
  const [devisLoading, setDevisLoading] = useState(false);
  const [devisActionId, setDevisActionId] = useState<string | null>(null);
  const [devisActionMsg, setDevisActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "devis" || !supabase || !user) return;
    setDevisLoading(true);

    supabase
      .from("quotes")
      .select("id,created_at,numero_devis,produits,prix_total_calcule,prix_negocie,statut,facture_generee,adresse_client,ville_client")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Devis error:", error);
          setDevis([]);
        } else {
          setDevis((data as Devis[]) || []);
        }
        setDevisLoading(false);
      });
  }, [activeTab, user]);

  // ── Onglet Commissions (partenaire) ──────────────────────────────
  const [commissions, setCommissions] = useState<any[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "commissions" || !supabase || !user) return;
    setCommissionsLoading(true);
    // Trouver l'id du partenaire lié à ce user
    supabase
      .from("partners")
      .select("id, nom")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: partner }) => {
        if (!partner) { setCommissions([]); setCommissionsLoading(false); return; }
        supabase!
          .from("quotes")
          .select("id,numero_devis,nom,produits,prix_negocie,prix_total_calcule,commission_montant,commission_payee,commission_pdf_url,statut,created_at")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            setCommissions(data ?? []);
            setCommissionsLoading(false);
          });
      });
  }, [activeTab, user]);

  // ── Valider / Refuser un devis ───────────────────────────────────
  const refetchDevis = () => {
    if (!supabase || !user) return;
    supabase
      .from("quotes")
      .select("id,created_at,numero_devis,produits,prix_total_calcule,prix_negocie,statut,facture_generee,adresse_client,ville_client")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setDevis((data as Devis[]) || []); });
  };

  const handleValiderDevis = async (id: string) => {
    if (!supabase) return;
    setDevisActionId(id);
    const { error } = await supabase
      .from("quotes")
      .update({ statut: "accepte", signe_le: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user!.id);
    setDevisActionId(null);
    if (!error) {
      setDevisActionMsg("Votre devis a été validé. Nous vous contactons sous 48h.");
      refetchDevis();
      setTimeout(() => setDevisActionMsg(null), 5000);
    }
  };

  const handleRefuserDevis = async (id: string) => {
    if (!supabase) return;
    setDevisActionId(id);
    const { error } = await supabase
      .from("quotes")
      .update({ statut: "refuse" })
      .eq("id", id)
      .eq("user_id", user!.id);
    setDevisActionId(null);
    if (!error) {
      setDevisActionMsg("Devis refusé. N'hésitez pas à nous recontacter.");
      refetchDevis();
      setTimeout(() => setDevisActionMsg(null), 4000);
    }
  };

  // ── Onglet 4 : Sécurité ──────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    if (!supabase) return;
    if (newPassword !== confirmPassword) {
      setPwdError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setPwdLoading(true);
    setPwdError(null);
    setPwdSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwdSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: unknown) {
      setPwdError((err as Error).message || "Erreur lors de la mise à jour");
    } finally {
      setPwdLoading(false);
    }
  };

  // ── Loading state — spinner max 3s (timeout dans AuthContext) ──────
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
                      : user.app_metadata?.provider === "facebook"
                      ? "Connecté via Facebook"
                      : user.app_metadata?.provider === "apple"
                      ? "Connecté via Apple"
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

            {/* ── Onglet 1 : Mes informations ── */}
            {activeTab === "infos" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Mes informations</h2>
                  {!editMode && (
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(true)}
                      className="border-[#4A90D9] text-[#4A90D9] hover:bg-[#4A90D9] hover:text-white"
                    >
                      Modifier
                    </Button>
                  )}
                </div>

                {infoSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 mb-6">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Informations mises à jour avec succès.</span>
                  </div>
                )}
                {infoError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 mb-6">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{infoError}</span>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Prénom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile?.first_name || "—"}</span>
                      </div>
                    )}
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile?.last_name || "—"}</span>
                      </div>
                    )}
                  </div>

                  {/* Email (lecture seule) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 truncate">{user.email}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      L'email ne peut pas être modifié depuis cet espace.
                    </p>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+596 6 00 00 00 00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile?.phone || "—"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="flex items-center gap-3 mt-8">
                    <Button
                      onClick={handleSaveInfos}
                      disabled={infoLoading}
                      className="bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold py-5 px-8"
                    >
                      {infoLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sauvegarde…</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Sauvegarder</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false);
                        setInfoError(null);
                        setFirstName(profile?.first_name || "");
                        setLastName(profile?.last_name || "");
                        setPhone(profile?.phone || "");
                      }}
                      disabled={infoLoading}
                      className="border-gray-300 text-gray-700"
                    >
                      Annuler
                    </Button>
                  </div>
                )}

                {/* ── Section Adresses ── */}
                <div className="mt-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span>📍</span> Mes adresses
                  </h3>

                  {/* Adresse de facturation */}
                  <div className="border border-gray-100 rounded-xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-gray-800 text-sm">Adresse de facturation</p>
                      {!adresseFactEditing && (
                        <button onClick={() => setAdresseFactEditing(true)} className="text-xs text-[#4A90D9] font-medium hover:underline">
                          Modifier
                        </button>
                      )}
                    </div>
                    {adresseFactSuccess && (
                      <div className="flex items-center gap-2 text-emerald-600 text-xs mb-3">
                        <CheckCircle2 className="h-4 w-4" /> Adresse sauvegardée.
                      </div>
                    )}
                    {adresseFactEditing ? (
                      <div className="space-y-3">
                        <input type="text" value={adresseFact} onChange={e => setAdresseFact(e.target.value)} placeholder="Rue et numéro" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" value={cpFact} onChange={e => setCpFact(e.target.value)} placeholder="Code postal" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none" />
                          <input type="text" value={villeFact} onChange={e => setVilleFact(e.target.value)} placeholder="Ville" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none" />
                        </div>
                        <select value={paysFact} onChange={e => setPaysFact(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none bg-white">
                          {["France","Martinique","Guadeloupe","Guyane","La Réunion","Mayotte","Nouvelle-Calédonie","Polynésie française","Saint-Martin","Saint-Barthélemy","Belgique","Suisse","Canada","Autre"].map(p => <option key={p}>{p}</option>)}
                        </select>
                        <div className="flex gap-3">
                          <button onClick={handleSaveAdresseFact} disabled={adresseFactLoading} className="px-4 py-2 bg-[#4A90D9] text-white text-xs font-bold rounded-lg hover:bg-[#3a7bc8] disabled:opacity-50">
                            {adresseFactLoading ? "Sauvegarde…" : "Enregistrer"}
                          </button>
                          <button onClick={() => setAdresseFactEditing(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {adresseFact ? (
                          <p>{adresseFact}{cpFact || villeFact ? `, ${cpFact} ${villeFact}`.trim() : ""}{paysFact && paysFact !== "France" ? `, ${paysFact}` : ""}</p>
                        ) : (
                          <p className="text-gray-400 italic">Aucune adresse enregistrée</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Adresse de livraison */}
                  <div className="border border-gray-100 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-gray-800 text-sm">Adresse de livraison</p>
                      {!adresseLivEditing && (
                        <button onClick={() => setAdresseLivEditing(true)} className="text-xs text-[#4A90D9] font-medium hover:underline">
                          Modifier
                        </button>
                      )}
                    </div>
                    {adresseLivSuccess && (
                      <div className="flex items-center gap-2 text-emerald-600 text-xs mb-3">
                        <CheckCircle2 className="h-4 w-4" /> Adresse sauvegardée.
                      </div>
                    )}
                    {adresseLivEditing ? (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={livIdent} onChange={e => setLivIdent(e.target.checked)} className="rounded" />
                          Identique à l'adresse de facturation
                        </label>
                        {!livIdent && (
                          <>
                            <input type="text" value={adresseLiv} onChange={e => setAdresseLiv(e.target.value)} placeholder="Rue et numéro" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none" />
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" value={cpLiv} onChange={e => setCpLiv(e.target.value)} placeholder="Code postal" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none" />
                              <input type="text" value={villeLiv} onChange={e => setVilleLiv(e.target.value)} placeholder="Ville" className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none" />
                            </div>
                            <select value={paysLiv} onChange={e => setPaysLiv(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-[#4A90D9] outline-none bg-white">
                              {["France","Martinique","Guadeloupe","Guyane","La Réunion","Mayotte","Nouvelle-Calédonie","Polynésie française","Saint-Martin","Saint-Barthélemy","Belgique","Suisse","Canada","Autre"].map(p => <option key={p}>{p}</option>)}
                            </select>
                          </>
                        )}
                        <div className="flex gap-3">
                          <button onClick={handleSaveAdresseLiv} disabled={adresseLivLoading} className="px-4 py-2 bg-[#4A90D9] text-white text-xs font-bold rounded-lg hover:bg-[#3a7bc8] disabled:opacity-50">
                            {adresseLivLoading ? "Sauvegarde…" : "Enregistrer"}
                          </button>
                          <button onClick={() => setAdresseLivEditing(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {livIdent ? (
                          <p className="text-gray-400 italic">Identique à l'adresse de facturation</p>
                        ) : adresseLiv ? (
                          <p>{adresseLiv}{cpLiv || villeLiv ? `, ${cpLiv} ${villeLiv}`.trim() : ""}{paysLiv && paysLiv !== "France" ? `, ${paysLiv}` : ""}</p>
                        ) : (
                          <p className="text-gray-400 italic">Aucune adresse enregistrée</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Onglet 2 : Mes commandes (devis acceptés) ── */}
            {activeTab === "commandes" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes commandes</h2>
                <p className="text-sm text-gray-400 mb-8">Devis validés — en cours de préparation.</p>
                {commandesLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
                  </div>
                ) : commandes.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucune commande confirmée pour le moment</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Vos devis validés apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {commandes.map((cmd: any) => (
                      <div key={cmd.id} className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-gray-900 text-sm">
                                {cmd.numero_devis || `#${cmd.id.slice(0, 8).toUpperCase()}`}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                Confirmé
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">
                              {new Date(cmd.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                            {Array.isArray(cmd.produits) && cmd.produits.length > 0 && (
                              <ul className="text-xs text-gray-500 space-y-0.5">
                                {cmd.produits.slice(0, 3).map((p: any, i: number) => (
                                  <li key={i}>• {p.nom || p.name || "—"}</li>
                                ))}
                                {cmd.produits.length > 3 && (
                                  <li className="text-gray-400">+{cmd.produits.length - 3} autre(s)</li>
                                )}
                              </ul>
                            )}
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            {(cmd.prix_negocie ?? cmd.prix_total_calcule) != null && (
                              <p className="font-bold text-emerald-600 text-base">
                                {formatEur(cmd.prix_negocie ?? cmd.prix_total_calcule ?? 0)}
                              </p>
                            )}
                            {cmd.facture_generee && (
                              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <Download className="h-3.5 w-3.5" /> Facture disponible dans "Mes devis"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet 3 : Mes devis ── */}
            {activeTab === "devis" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes devis</h2>
                {devisActionMsg && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm mb-4">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> {devisActionMsg}
                  </div>
                )}
                {devisLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
                  </div>
                ) : devis.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucun devis pour le moment</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Ajoutez des produits au panier et générez votre premier devis.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {devis.map((d) => {
                      const statutColors: Record<string, string> = {
                        nouveau: "bg-blue-100 text-blue-700",
                        en_cours: "bg-orange-100 text-orange-700",
                        negociation: "bg-purple-100 text-purple-700",
                        accepte: "bg-emerald-100 text-emerald-700",
                        refuse: "bg-red-100 text-red-700",
                      };
                      const statutLabels: Record<string, string> = {
                        nouveau: "Nouveau",
                        en_cours: "En cours",
                        negociation: "Négociation",
                        accepte: "Accepté",
                        refuse: "Refusé",
                      };

                      const handleDownloadDevis = () => {
                        const today = new Date(d.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "long", year: "numeric",
                        });
                        // BUG 1 FIX: s'assurer que produits est bien un Array (pas une string JSON)
                        const produitsArr: any[] = Array.isArray(d.produits) ? d.produits : [];
                        const lignes = produitsArr.map((p: any) => {
                          const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
                          const qty = p.quantite ?? 1;
                          return {
                            nom: String(p.nom || p.name || p.id || "—"),
                            description: p.description || "",
                            prixUnitaire: pu,
                            quantite: qty,
                            total: Math.round(pu * qty),
                          };
                        });
                        const devisData: DevisData = {
                          numeroDevis: d.numero_devis || d.id.slice(0, 8).toUpperCase(),
                          date: today,
                          client: {
                            nom: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user?.email ?? "",
                            adresse: d.adresse_client || "",
                            ville: d.ville_client || "",
                            pays: "France",
                            email: user?.email ?? "",
                            telephone: profile?.phone || undefined,
                          },
                          produits: lignes,
                          totalHT: d.prix_negocie ?? d.prix_total_calcule ?? 0,
                          role: role ?? "user",
                        };
                        const blob = generateDevisPDF(devisData);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = `Devis_${devisData.numeroDevis}.pdf`;
                        document.body.appendChild(a); a.click();
                        document.body.removeChild(a); URL.revokeObjectURL(url);
                      };

                      const handleDownloadFacture = () => {
                        const today = new Date().toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "long", year: "numeric",
                        });
                        const dateDevis = new Date(d.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "long", year: "numeric",
                        });
                        const produitsArr2: any[] = Array.isArray(d.produits) ? d.produits : [];
                        const lignes = produitsArr2.map((p: any) => {
                          const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
                          const qty = p.quantite ?? 1;
                          return {
                            nom: String(p.nom || p.name || p.id || "—"),
                            prixUnitaire: pu,
                            quantite: qty,
                            total: Math.round(pu * qty),
                          };
                        });
                        const factureNum = (d.numero_devis || "D00001").replace("D", "F");
                        const factureData: FactureData = {
                          numeroFacture: factureNum,
                          dateFacture: today,
                          numeroDevis: d.numero_devis,
                          dateDevis,
                          client: {
                            nom: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user?.email ?? "",
                            adresse: d.adresse_client || "",
                            ville: d.ville_client || "",
                            pays: "France",
                            email: user?.email ?? "",
                            telephone: profile?.phone || undefined,
                          },
                          produits: lignes,
                          totalHT: d.prix_negocie ?? d.prix_total_calcule ?? 0,
                        };
                        const blob = generateFacturePDF(factureData);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = `Facture_${factureNum}.pdf`;
                        document.body.appendChild(a); a.click();
                        document.body.removeChild(a); URL.revokeObjectURL(url);
                      };

                      return (
                        <div key={d.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-gray-900 text-sm">
                                  {d.numero_devis || `#${d.id.slice(0, 8).toUpperCase()}`}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColors[d.statut] ?? "bg-gray-100 text-gray-600"}`}>
                                  {statutLabels[d.statut] ?? d.statut}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">
                                {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                              </p>
                              {(d.produits || []).length > 0 && (
                                <ul className="text-xs text-gray-500 space-y-0.5">
                                  {(d.produits || []).slice(0, 3).map((p: any, i: number) => (
                                    <li key={i}>• {p.nom || p.name || p.id}</li>
                                  ))}
                                  {(d.produits || []).length > 3 && (
                                    <li className="text-gray-400">+{(d.produits || []).length - 3} autre(s)</li>
                                  )}
                                </ul>
                              )}
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              {(d.prix_negocie ?? d.prix_total_calcule) != null && (
                                <p className="font-bold text-[#4A90D9] text-base">
                                  {formatEur(d.prix_negocie ?? d.prix_total_calcule ?? 0)}
                                </p>
                              )}
                              <button
                                onClick={handleDownloadDevis}
                                className="flex items-center gap-1.5 text-xs text-[#4A90D9] font-medium hover:underline"
                              >
                                <Download className="h-3.5 w-3.5" /> Devis PDF
                              </button>
                              {d.facture_generee && (
                                <button
                                  onClick={handleDownloadFacture}
                                  className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium hover:underline"
                                >
                                  <Download className="h-3.5 w-3.5" /> Facture PDF
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Boutons Valider / Refuser */}
                          {["nouveau", "en_cours", "negociation"].includes(d.statut) && (
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => handleValiderDevis(d.id)}
                                disabled={devisActionId === d.id}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                {devisActionId === d.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Valider ce devis
                              </button>
                              <button
                                onClick={() => handleRefuserDevis(d.id)}
                                disabled={devisActionId === d.id}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet Commissions Partenaire ── */}
            {activeTab === "commissions" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes commissions</h2>
                <p className="text-sm text-gray-400 mb-6">Suivi des commissions sur les devis qui vous sont attribués.</p>
                {commissionsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-medium">Aucune commission pour le moment</p>
                    <p className="text-sm mt-1">Les devis qui vous seront attribués apparaîtront ici.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Résumé */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-orange-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Total commissions dues</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatEur(commissions.filter((c) => !c.commission_payee).reduce((s: number, c: any) => s + (c.commission_montant ?? 0), 0))}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Total commissions payées</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {formatEur(commissions.filter((c) => c.commission_payee).reduce((s: number, c: any) => s + (c.commission_montant ?? 0), 0))}
                        </p>
                      </div>
                    </div>
                    {/* Liste */}
                    <div className="space-y-3">
                      {commissions.map((c: any) => (
                        <div key={c.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-gray-800">{c.numero_devis || c.id.slice(0, 8)}</span>
                              <span className="text-gray-400 mx-2">·</span>
                              <span className="text-gray-600 text-sm">{c.nom}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-orange-600">{c.commission_montant ? formatEur(c.commission_montant) : "—"}</span>
                              {c.commission_payee ? (
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Payée ✓</span>
                              ) : (
                                <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">En attente</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                            <span>Prix négocié : {formatEur(c.prix_negocie ?? c.prix_total_calcule ?? 0)}</span>
                          </div>
                          {c.commission_pdf_url && (
                            <a
                              href={c.commission_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center gap-1.5 text-xs text-orange-500 font-medium hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> Télécharger note de commission
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet 4 : Sécurité ── */}
            {activeTab === "securite" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Sécurité</h2>

                {pwdSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 mb-6">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      Mot de passe mis à jour avec succès.
                    </span>
                  </div>
                )}
                {pwdError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 mb-6">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{pwdError}</span>
                  </div>
                )}

                <div className="max-w-md space-y-6">
                  {/* Nouveau mot de passe */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 caractères"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showConfirmPwd ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retapez le mot de passe"
                        className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPwd ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleUpdatePassword}
                    disabled={pwdLoading || !newPassword || !confirmPassword}
                    className="bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold py-5 px-8"
                  >
                    {pwdLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</>
                    ) : (
                      <><Shield className="mr-2 h-4 w-4" />Mettre à jour le mot de passe</>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
