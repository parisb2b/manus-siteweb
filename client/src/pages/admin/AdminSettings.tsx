import { useState, useEffect, useRef } from "react";
import { Save, Settings, Palette, Globe, Type, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";

export default function AdminSettings() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "site_content")
      .single()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          setSiteContent(data.value);
        }
        setLoading(false);
      }, () => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    setSaveMessage("");
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "site_content", value: siteContent, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaveMessage(error ? "Erreur lors de la sauvegarde" : "Paramètres sauvegardés avec succès");
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

      {/* Card 4: SEO & Réseaux sociaux */}
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
