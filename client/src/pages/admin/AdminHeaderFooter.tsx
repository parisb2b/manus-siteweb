import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import {
  Save, Upload, Image as ImageIcon, Link, Phone, Mail,
  MessageCircle, Youtube, Layout, AlignLeft, Plus, Trash2,
  ArrowUp, ArrowDown, Eye, Globe, Type
} from "lucide-react";

interface FooterLink {
  label: string;
  path: string;
}

export default function AdminHeaderFooter() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"header" | "footer">("header");
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "site_content")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const d = data.value;
          if (!d.siteSettings) d.siteSettings = {};
          if (!d.navigation) d.navigation = { menuItems: [], footerLinks: [] };
          if (!d.navigation.footerLinks) d.navigation.footerLinks = [];
          setSiteContent(d);
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
    setSaveMessage(error ? "✗ Erreur lors de la sauvegarde" : "✓ Sauvegardé avec succès");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const updateSetting = (field: string, value: string) => {
    setSiteContent((prev: any) => ({
      ...prev,
      siteSettings: { ...prev.siteSettings, [field]: value },
    }));
  };

  const getSetting = (field: string): string =>
    siteContent?.siteSettings?.[field] ?? "";

  // Upload logo via Supabase Storage
  const uploadLogo = async (
    file: File,
    field: string,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, "logos");
      if (url) updateSetting(field, url);
    } catch {
      // silent
    }
    setUploading(false);
  };

  // Footer links
  const footerLinks: FooterLink[] =
    siteContent?.navigation?.footerLinks ?? [];

  const updateFooterLinks = (links: FooterLink[]) => {
    setSiteContent((prev: any) => ({
      ...prev,
      navigation: { ...prev.navigation, footerLinks: links },
    }));
  };

  const addFooterLink = () => {
    updateFooterLinks([...footerLinks, { label: "Nouveau lien", path: "/" }]);
  };

  const updateFooterLink = (i: number, field: keyof FooterLink, value: string) => {
    const updated = [...footerLinks];
    updated[i] = { ...updated[i], [field]: value };
    updateFooterLinks(updated);
  };

  const removeFooterLink = (i: number) => {
    updateFooterLinks(footerLinks.filter((_, idx) => idx !== i));
  };

  const moveFooterLink = (i: number, dir: "up" | "down") => {
    const target = dir === "up" ? i - 1 : i + 1;
    if (target < 0 || target >= footerLinks.length) return;
    const updated = [...footerLinks];
    [updated[i], updated[target]] = [updated[target], updated[i]];
    updateFooterLinks(updated);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 font-sans">
        Chargement...
      </div>
    );
  }

  if (!siteContent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-red-500 font-sans">
        Impossible de charger le contenu.
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Header & Footer</h1>
          <p className="text-gray-500 mt-1">Gérez les logos, textes et liens du header et du footer</p>
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
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          saveMessage.includes("✗")
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("header")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === "header"
              ? "bg-[#4A90D9] text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Layout className="w-4 h-4" />
          Header
        </button>
        <button
          onClick={() => setActiveTab("footer")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === "footer"
              ? "bg-[#4A90D9] text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <AlignLeft className="w-4 h-4" />
          Footer
        </button>
      </div>

      {/* ======== HEADER TAB ======== */}
      {activeTab === "header" && (
        <div className="space-y-6">
          {/* Logo header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Logo du Header</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-6">
                <div className="w-40 h-20 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-2">
                  {getSetting("headerLogo") || getSetting("logo") ? (
                    <img
                      src={getSetting("headerLogo") || getSetting("logo")}
                      alt="Logo header"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/logo_import97_large.png";
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400 text-center">Aucun logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {/* Upload file */}
                  <div>
                    <input
                      type="file"
                      ref={headerInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadLogo(file, "headerLogo", setUploadingHeader);
                      }}
                    />
                    <button
                      onClick={() => headerInputRef.current?.click()}
                      disabled={uploadingHeader}
                      className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingHeader ? "Upload en cours..." : "Téléverser une image"}
                    </button>
                    <p className="text-xs text-gray-400 mt-1.5">PNG, JPG, SVG — fond transparent recommandé</p>
                  </div>
                  {/* Or URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ou coller une URL</label>
                    <input
                      type="text"
                      value={getSetting("headerLogo") || getSetting("logo")}
                      onChange={(e) => updateSetting("headerLogo", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-sm text-gray-800"
                      placeholder="/images/logo_import97_large.png"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg px-4 py-2.5 text-xs text-blue-700">
                <strong>Actuellement affiché :</strong> {getSetting("headerLogo") || getSetting("logo") || "/images/logo_import97_large.png"}
              </div>
            </div>
          </div>

          {/* Bandeau haut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Type className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Bandeau promotionnel (barre bleue du haut)</h2>
            </div>
            <div className="px-6 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte du bandeau</label>
              <input
                type="text"
                value={getSetting("topBanner")}
                onChange={(e) => updateSetting("topBanner", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                placeholder="-50% PAR RAPPORT AU PRIX DE VENTE EN MARTINIQUE"
              />
              <p className="text-xs text-gray-400 mt-1.5">Affiché dans la barre bleue en haut de toutes les pages</p>
              {/* Live preview */}
              <div className="mt-3 bg-[#4A90D9] text-white text-center py-2 rounded-lg text-xs font-bold tracking-wider uppercase">
                {getSetting("topBanner") || "Aperçu du bandeau"}
              </div>
            </div>
          </div>

          {/* Couleur principale */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Couleur principale</h2>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={getSetting("primaryColor") || "#4A90D9"}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  className="w-14 h-14 rounded-xl border border-gray-300 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={getSetting("primaryColor")}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  className="w-40 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 font-mono"
                  placeholder="#4A90D9"
                />
                <div
                  className="w-28 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: getSetting("primaryColor") || "#4A90D9" }}
                >
                  Aperçu
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Utilisée pour les boutons, liens actifs et éléments colorés</p>
            </div>
          </div>
        </div>
      )}

      {/* ======== FOOTER TAB ======== */}
      {activeTab === "footer" && (
        <div className="space-y-6">
          {/* Logo footer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Logo du Footer</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="flex items-center gap-6">
                {/* Preview sur fond bleu */}
                <div className="w-40 h-20 bg-[#4A90D9] rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden p-2">
                  {getSetting("footerLogo") ? (
                    <img
                      src={getSetting("footerLogo")}
                      alt="Logo footer"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-white/70 text-center">Aucun logo footer</span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <input
                      type="file"
                      ref={footerInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadLogo(file, "footerLogo", setUploadingFooter);
                      }}
                    />
                    <button
                      onClick={() => footerInputRef.current?.click()}
                      disabled={uploadingFooter}
                      className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingFooter ? "Upload en cours..." : "Téléverser une image"}
                    </button>
                    <p className="text-xs text-gray-400 mt-1.5">Recommandé : logo blanc ou clair (fond footer bleu)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ou coller une URL</label>
                    <input
                      type="text"
                      value={getSetting("footerLogo")}
                      onChange={(e) => updateSetting("footerLogo", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-sm text-gray-800"
                      placeholder="/images/logo_import97_footer_transparent.png"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Texte footer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Type className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Textes du Footer</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (colonne gauche)</label>
                <textarea
                  value={getSetting("footerDescription")}
                  onChange={(e) => updateSetting("footerDescription", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 resize-y"
                  placeholder="Description affichée sous le logo dans le footer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte copyright (bas du footer)</label>
                <input
                  type="text"
                  value={getSetting("footerText")}
                  onChange={(e) => updateSetting("footerText", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  placeholder="97 import - Tous droits réservés"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées de contact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Coordonnées de contact</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" /> Email de contact
                </label>
                <input
                  type="email"
                  value={getSetting("contactEmail")}
                  onChange={(e) => updateSetting("contactEmail", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  placeholder="info@97import.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" /> Téléphone
                </label>
                <input
                  type="text"
                  value={getSetting("contactPhone")}
                  onChange={(e) => updateSetting("contactPhone", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  placeholder="+33 6 63 28 49 08"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-gray-400" /> Numéro WhatsApp
                </label>
                <input
                  type="tel"
                  value={getSetting("whatsappNumber")}
                  onChange={(e) => updateSetting("whatsappNumber", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  placeholder="+33663284908"
                />
                <p className="text-xs text-gray-400 mt-1">Format international sans espaces (ex: +33663284908)</p>
              </div>
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">Réseaux sociaux</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <span className="font-bold text-gray-600">TikTok</span> URL
                </label>
                <input
                  type="url"
                  value={getSetting("tiktokUrl")}
                  onChange={(e) => updateSetting("tiktokUrl", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  placeholder="https://www.tiktok.com/@votre-compte"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" /> YouTube URL
                </label>
                <input
                  type="url"
                  value={getSetting("youtubeUrl")}
                  onChange={(e) => updateSetting("youtubeUrl", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
                  placeholder="https://www.youtube.com/@votre-chaine"
                />
              </div>
            </div>
          </div>

          {/* Liens du footer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-[#4A90D9]" />
                <h2 className="text-lg font-semibold text-gray-800">Liens du Footer</h2>
                <span className="text-sm text-gray-400 ml-1">{footerLinks.length} lien{footerLinks.length !== 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={addFooterLink}
                className="inline-flex items-center gap-1.5 text-[#4A90D9] hover:text-[#357ABD] font-semibold text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {footerLinks.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400">
                  <Link className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucun lien dans le footer.</p>
                  <p className="text-xs mt-1">Note : le Footer affiche aussi automatiquement les liens du menu principal.</p>
                </div>
              ) : (
                footerLinks.map((link, i) => (
                  <div key={i} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Libellé</label>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateFooterLink(i, "label", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-sm text-gray-800"
                          placeholder="Libellé du lien"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">URL / Chemin</label>
                        <input
                          type="text"
                          value={link.path}
                          onChange={(e) => updateFooterLink(i, "path", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-sm text-gray-800 font-mono"
                          placeholder="/chemin ou https://..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => moveFooterLink(i, "up")}
                        disabled={i === 0}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                        title="Monter"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveFooterLink(i, "down")}
                        disabled={i === footerLinks.length - 1}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                        title="Descendre"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFooterLink(i)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span>Le footer affiche automatiquement les liens du menu principal en plus de ces liens personnalisés.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
