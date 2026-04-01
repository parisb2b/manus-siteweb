import { useState, useEffect, useRef } from "react";
import { Save, Settings, Palette, Globe, Type, Upload, Building2, CreditCard, Percent } from "lucide-react";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";

interface AdminParam {
  key: string;
  value: any;
  label?: string;
}

export default function AdminSettings() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Paramètres métier (admin_params)
  const [emetteur, setEmetteur] = useState<any>({});
  const [rib, setRib] = useState<any>({});
  const [acompteDefaut, setAcompteDefaut] = useState<number>(30);
  const [paramsLoaded, setParamsLoaded] = useState(false);

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file, "logos");
      if (url) updateSetting("logo", url);
    } catch {
      // silent
    }
    setUploadingLogo(false);
  };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    // Charger site_content + admin_params en parallèle
    Promise.all([
      supabase.from("site_content").select("value").eq("key", "site_content").single(),
      supabase.from("admin_params").select("*"),
    ]).then(([scResult, apResult]) => {
      if (scResult.data?.value && typeof scResult.data.value === "object") {
        setSiteContent(scResult.data.value);
      }
      // Charger params métier
      const params = (apResult.data as AdminParam[]) ?? [];
      for (const p of params) {
        if (p.key === "emetteur") setEmetteur(p.value ?? {});
        if (p.key === "rib") setRib(p.value ?? {});
        if (p.key === "acompte_defaut") setAcompteDefaut(p.value?.pourcentage ?? 30);
      }
      setParamsLoaded(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    setSaveMessage("");
    const now = new Date().toISOString();
    const results = await Promise.all([
      supabase.from("site_content").upsert({ key: "site_content", value: siteContent, updated_at: now }),
      supabase.from("admin_params").upsert({ key: "emetteur", value: emetteur, label: "Informations \u00E9metteur", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "rib", value: rib, label: "Coordonn\u00E9es bancaires (RIB)", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "acompte_defaut", value: { pourcentage: acompteDefaut }, label: "Pourcentage acompte", updated_at: now }),
    ]);
    const hasError = results.some((r) => r.error);
    setSaving(false);
    setSaveMessage(hasError ? "Erreur lors de la sauvegarde" : "Param\u00E8tres sauvegard\u00E9s avec succ\u00E8s");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const updateSetting = (field: string, value: string) => {
    setSiteContent((prev: any) => ({
      ...prev,
      siteSettings: {
        ...prev.siteSettings,
        [field]: value,
      },
    }));
  };

  const getSetting = (field: string): string => {
    return siteContent?.siteSettings?.[field] ?? "";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 font-sans">
        Chargement des paramètres...
      </div>
    );
  }

  if (!siteContent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-red-500 font-sans">
        Impossible de charger les paramètres du site.
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
          <p className="text-gray-500 mt-1">Configuration générale du site</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            saveMessage.includes("Erreur")
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Card 1: Informations générales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          {/* Nom du site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du site
            </label>
            <input
              type="text"
              value={getSetting("siteName")}
              onChange={(e) => updateSetting("siteName", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="Nom du site"
            />
          </div>

          {/* Email de contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email de contact
            </label>
            <input
              type="email"
              value={getSetting("contactEmail")}
              onChange={(e) => updateSetting("contactEmail", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="contact@exemple.com"
            />
          </div>

          {/* Téléphone de contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Téléphone de contact
            </label>
            <input
              type="text"
              value={getSetting("contactPhone")}
              onChange={(e) => updateSetting("contactPhone", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="+596 596 00 00 00"
            />
          </div>

          {/* Numéro WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Numéro WhatsApp
            </label>
            <input
              type="tel"
              value={getSetting("whatsappNumber")}
              onChange={(e) => updateSetting("whatsappNumber", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="+596696000000"
            />
            <p className="text-xs text-gray-400 mt-1">
              Format international avec indicatif pays (ex: +596696000000)
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Apparence */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Apparence</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          {/* Couleur principale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Couleur principale
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={getSetting("primaryColor") || "#4A90D9"}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer p-1"
              />
              <input
                type="text"
                value={getSetting("primaryColor")}
                onChange={(e) => updateSetting("primaryColor", e.target.value)}
                className="w-40 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 font-mono"
                placeholder="#4A90D9"
              />
              <div
                className="w-24 h-10 rounded-xl border border-gray-200"
                style={{ backgroundColor: getSetting("primaryColor") || "#4A90D9" }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Cette couleur sera utilisée pour les boutons et éléments principaux du site.
            </p>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo du site</label>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-32 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 p-1 flex items-center justify-center">
                {getSetting("logo") ? (
                  <img src={getSetting("logo")} alt="Logo preview" className="w-full h-full object-contain" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                ) : (
                  <span className="text-xs text-gray-400">Aucun logo</span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? "Upload..." : "Téléverser"}
                </button>
                <p className="text-xs text-gray-400">PNG, JPG, SVG recommandé</p>
              </div>
            </div>
            <input
              type="text"
              value={getSetting("logo")}
              onChange={(e) => updateSetting("logo", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="/images/logo_import97_large.png"
            />
            <p className="text-xs text-gray-400 mt-1">💡 Pour gérer séparément le logo header et footer, utilisez la section <strong>Header & Footer</strong></p>
          </div>

          {/* Favicon URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Favicon URL
            </label>
            <input
              type="text"
              value={getSetting("faviconUrl")}
              onChange={(e) => updateSetting("faviconUrl", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="https://exemple.com/favicon.ico"
            />
            {getSetting("faviconUrl") && (
              <div className="mt-2 w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 p-1">
                <img src={getSetting("faviconUrl")} alt="Favicon preview" className="w-full h-full object-contain" onError={e => (e.target as HTMLImageElement).style.display = "none"} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: Contenu */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Type className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Contenu</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          {/* Bandeau en haut du site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bandeau en haut du site
            </label>
            <input
              type="text"
              value={getSetting("topBanner")}
              onChange={(e) => updateSetting("topBanner", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="Livraison gratuite dès 50€ d'achat !"
            />
            <p className="text-xs text-gray-400 mt-1">
              Texte affiché dans la barre bleue en haut du site
            </p>
          </div>

          {/* Texte du footer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Texte du footer
            </label>
            <input
              type="text"
              value={getSetting("footerText")}
              onChange={(e) => updateSetting("footerText", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="97 import - Tous droits réservés"
            />
          </div>

          {/* Description du footer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description du footer
            </label>
            <textarea
              value={getSetting("footerDescription")}
              onChange={(e) => updateSetting("footerDescription", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 resize-vertical"
              placeholder="Description affichée dans le pied de page du site"
            />
          </div>
        </div>
      </div>

      {/* Card 4: Informations émetteur (documents PDF) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">{"\u00C9metteur (documents PDF)"}</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale</label>
              <input type="text" value={emetteur.nom ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, nom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="97 IMPORT / LUXENT LIMITED" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={emetteur.email ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="contact@97import.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={emetteur.adresse ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, adresse: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="123 rue Example" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville / CP</label>
              <input type="text" value={emetteur.ville ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, ville: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="75001 Paris" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
              <input type="text" value={emetteur.pays ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, pays: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="France" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{"\u0054\u00E9l\u00E9phone"}</label>
              <input type="text" value={emetteur.telephone ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, telephone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="+33 1 23 45 67 89" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET / N° entreprise</label>
              <input type="text" value={emetteur.siret ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, siret: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="XXX XXX XXX XXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TVA Intracommunautaire</label>
              <input type="text" value={emetteur.tva_intra ?? ""} onChange={(e) => setEmetteur((p: any) => ({ ...p, tva_intra: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="FRXX XXXXXXXXX" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 5: Coordonnées bancaires (RIB) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">{"\u0043oordonn\u00E9es bancaires (RIB)"}</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banque</label>
            <input type="text" value={rib.banque ?? ""} onChange={(e) => setRib((p: any) => ({ ...p, banque: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="Banque Example" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <input type="text" value={rib.iban ?? ""} onChange={(e) => setRib((p: any) => ({ ...p, iban: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">BIC / SWIFT</label>
            <input type="text" value={rib.bic ?? ""} onChange={(e) => setRib((p: any) => ({ ...p, bic: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="XXXXXXXX" />
          </div>
        </div>
      </div>

      {/* Card 6: Configuration acomptes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Percent className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Configuration acomptes</h2>
        </div>
        <div className="px-6 py-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage acompte par d\u00E9faut</label>
            <div className="flex items-center gap-3">
              <input type="number" min={0} max={100} value={acompteDefaut}
                onChange={(e) => setAcompteDefaut(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" />
              <span className="text-sm text-gray-500">%</span>
              <p className="text-xs text-gray-400 ml-4">Utilis\u00E9 lors de la g\u00E9n\u00E9ration des factures d'acompte</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 7: SEO & Réseaux sociaux */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">SEO & Réseaux sociaux</h2>
        </div>
        <div className="px-6 py-6 space-y-5">
          {/* Meta description SEO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Meta description SEO
            </label>
            <textarea
              value={getSetting("metaDescription")}
              onChange={(e) => updateSetting("metaDescription", e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 resize-vertical"
              placeholder="Description du site pour les moteurs de recherche (max 160 caractères)"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {getSetting("metaDescription").length} / 160 caractères
            </p>
          </div>

          {/* TikTok URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              TikTok URL
            </label>
            <input
              type="text"
              value={getSetting("tiktokUrl")}
              onChange={(e) => updateSetting("tiktokUrl", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="https://www.tiktok.com/@votre-compte"
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              YouTube URL
            </label>
            <input
              type="text"
              value={getSetting("youtubeUrl")}
              onChange={(e) => updateSetting("youtubeUrl", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              placeholder="https://www.youtube.com/@votre-chaine"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
