import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  Save, Loader2, CheckCircle2, AlertCircle,
  ShoppingBag, FileText, Shield, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Tab = "infos" | "commandes" | "devis" | "securite";

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
  subject?: string;
  message?: string;
  read: boolean;
  archived: boolean;
};

export default function MonCompte() {
  const [, setLocation] = useLocation();
  const { user, profile, loading, setShowAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("infos");

  // ── Redirection si non connecté ─────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
      setLocation("/");
    }
  }, [user, loading]);

  // ── Onglet 1 : Mes informations ──────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNom(profile.nom || "");
      setPrenom(profile.prenom || "");
      setTelephone(profile.telephone || "");
    }
  }, [profile]);

  const handleSaveInfos = async () => {
    if (!supabase || !user) return;
    setInfoLoading(true);
    setInfoError(null);
    setInfoSuccess(false);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nom, prenom, telephone })
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
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCommandes((data as Commande[]) || []);
        setCommandesLoading(false);
      })
      .catch(() => {
        setCommandes([]);
        setCommandesLoading(false);
      });
  }, [activeTab, user]);

  // ── Onglet 3 : Mes devis ─────────────────────────────────────────
  const [devis, setDevis] = useState<Devis[]>([]);
  const [devisLoading, setDevisLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "devis" || !supabase || !user) return;
    setDevisLoading(true);
    supabase
      .from("contacts")
      .select("*")
      .eq("email", user.email!)
      .in("source", ["services", "cart"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDevis((data as Devis[]) || []);
        setDevisLoading(false);
      })
      .catch(() => {
        setDevis([]);
        setDevisLoading(false);
      });
  }, [activeTab, user]);

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

  // ── Loading state ─────────────────────────────────────────────────
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
    { id: "securite",  label: "Sécurité",         icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-white py-12 md:py-16 border-b border-gray-100">
        <div className="container mx-auto px-4">
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
                  {profile?.prenom} {profile?.nom}
                </span>
              </p>
            </div>
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
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile?.prenom || "—"}</span>
                      </div>
                    )}
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile?.nom || "—"}</span>
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
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{profile?.telephone || "—"}</span>
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
                        setNom(profile?.nom || "");
                        setPrenom(profile?.prenom || "");
                        setTelephone(profile?.telephone || "");
                      }}
                      disabled={infoLoading}
                      className="border-gray-300 text-gray-700"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet 2 : Historique commandes ── */}
            {activeTab === "commandes" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Mes commandes</h2>
                {commandesLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
                  </div>
                ) : commandes.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Aucune commande pour le moment</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Vos futures commandes apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-100">
                          <th className="pb-3 font-semibold text-gray-600">Date</th>
                          <th className="pb-3 font-semibold text-gray-600">Produit</th>
                          <th className="pb-3 font-semibold text-gray-600">Montant</th>
                          <th className="pb-3 font-semibold text-gray-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commandes.map((cmd) => (
                          <tr key={cmd.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-4 text-gray-600">
                              {new Date(cmd.created_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="py-4 text-gray-900 font-medium">
                              {cmd.product_name || "—"}
                            </td>
                            <td className="py-4 text-gray-900">
                              {cmd.amount != null ? `${cmd.amount} €` : "—"}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                cmd.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : cmd.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {cmd.status || "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Onglet 3 : Mes devis ── */}
            {activeTab === "devis" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Mes demandes de devis</h2>
                {devisLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
                  </div>
                ) : devis.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      Aucune demande de devis pour le moment
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Vos demandes de devis apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-100">
                          <th className="pb-3 font-semibold text-gray-600">Date</th>
                          <th className="pb-3 font-semibold text-gray-600">Sujet</th>
                          <th className="pb-3 font-semibold text-gray-600">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devis.map((d) => (
                          <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-4 text-gray-600 whitespace-nowrap">
                              {new Date(d.created_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="py-4 text-gray-900 font-medium">
                              {d.subject ||
                                (d.message
                                  ? d.message.substring(0, 60) + (d.message.length > 60 ? "…" : "")
                                  : "—")}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                d.archived
                                  ? "bg-gray-100 text-gray-600"
                                  : d.read
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {d.archived ? "Archivé" : d.read ? "Vu" : "En attente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
