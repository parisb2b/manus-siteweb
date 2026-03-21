import { useState, useEffect } from "react";
import {
  User, Mail, Phone, Save, Loader2, CheckCircle2, AlertCircle,
  Plus, Trash2, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { User as SupaUser } from "@supabase/supabase-js";

interface Props {
  user: SupaUser;
  profile: any;
}

const PAYS_OPTIONS = [
  "France", "Martinique", "Guadeloupe", "Guyane", "La Réunion", "Mayotte",
  "Nouvelle-Calédonie", "Polynésie française", "Saint-Martin", "Saint-Barthélemy",
  "Belgique", "Suisse", "Canada", "Autre",
];

export default function ProfileTab({ user, profile }: Props) {
  // ── Infos personnelles ──
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // ── Adresse facturation ──
  const [adresseFactEditing, setAdresseFactEditing] = useState(false);
  const [adresseFact, setAdresseFact] = useState("");
  const [villeFact, setVilleFact] = useState("");
  const [cpFact, setCpFact] = useState("");
  const [paysFact, setPaysFact] = useState("France");
  const [adresseFactLoading, setAdresseFactLoading] = useState(false);
  const [adresseFactSuccess, setAdresseFactSuccess] = useState(false);

  // ── Adresse livraison ──
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

  const handleDeleteAdresseFact = async () => {
    if (!supabase || !user) return;
    if (!window.confirm("Supprimer l'adresse de facturation ?")) return;
    setAdresseFactLoading(true);
    await supabase.from("profiles").update({
      adresse_facturation: null, ville_facturation: null,
      code_postal_facturation: null, pays_facturation: null,
    }).eq("id", user.id);
    setAdresseFact(""); setVilleFact(""); setCpFact(""); setPaysFact("France");
    setAdresseFactLoading(false);
    setAdresseFactSuccess(true);
    setTimeout(() => setAdresseFactSuccess(false), 3000);
  };

  const handleDeleteAdresseLiv = async () => {
    if (!supabase || !user) return;
    if (!window.confirm("Supprimer l'adresse de livraison ?")) return;
    setAdresseLivLoading(true);
    await supabase.from("profiles").update({
      adresse_livraison: null, ville_livraison: null,
      code_postal_livraison: null, pays_livraison: null,
      adresse_livraison_identique: true,
    }).eq("id", user.id);
    setAdresseLiv(""); setVilleLiv(""); setCpLiv(""); setPaysLiv("France"); setLivIdent(true);
    setAdresseLivLoading(false);
    setAdresseLivSuccess(true);
    setTimeout(() => setAdresseLivSuccess(false), 3000);
  };

  return (
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
          <MapPin className="h-4 w-4" /> Mes adresses
        </h3>

        {/* Adresse de facturation */}
        <div className="border border-gray-100 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#4A90D9]" /> Adresse de facturation
            </p>
            {!adresseFactEditing && (
              <div className="flex items-center gap-2">
                {!adresseFact ? (
                  <button onClick={() => setAdresseFactEditing(true)} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline">
                    <Plus className="h-3 w-3" /> Ajouter
                  </button>
                ) : (
                  <>
                    <button onClick={() => setAdresseFactEditing(true)} className="text-xs text-[#4A90D9] font-medium hover:underline">
                      Modifier
                    </button>
                    <span className="text-gray-300">|</span>
                    <button onClick={handleDeleteAdresseFact} disabled={adresseFactLoading} className="flex items-center gap-1 text-xs text-red-500 font-medium hover:underline disabled:opacity-50">
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </button>
                  </>
                )}
              </div>
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
                {PAYS_OPTIONS.map(p => <option key={p}>{p}</option>)}
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
            <p className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orange-400" /> Adresse de livraison
            </p>
            {!adresseLivEditing && (
              <div className="flex items-center gap-2">
                {livIdent || !adresseLiv ? (
                  <button onClick={() => setAdresseLivEditing(true)} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline">
                    <Plus className="h-3 w-3" /> {livIdent ? "Définir une adresse différente" : "Ajouter"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => setAdresseLivEditing(true)} className="text-xs text-[#4A90D9] font-medium hover:underline">
                      Modifier
                    </button>
                    <span className="text-gray-300">|</span>
                    <button onClick={handleDeleteAdresseLiv} disabled={adresseLivLoading} className="flex items-center gap-1 text-xs text-red-500 font-medium hover:underline disabled:opacity-50">
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </button>
                  </>
                )}
              </div>
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
                    {PAYS_OPTIONS.map(p => <option key={p}>{p}</option>)}
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
  );
}
