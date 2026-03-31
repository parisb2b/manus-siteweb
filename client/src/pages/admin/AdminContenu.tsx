import { useState, useEffect } from "react";
import { Save, Globe, Loader2, Type, Phone, Truck, Layout } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminContenu() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from("site_content")
      .select("value")
      .eq("key", "site_content")
      .single()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "object") {
          setContent(data.value);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!supabase || !content) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "site_content", value: content, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaveMessage(error ? "Erreur lors de la sauvegarde" : "Contenu sauvegardé");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const get = (field: string): string => content?.siteSettings?.[field] ?? "";
  const set = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      siteSettings: { ...prev?.siteSettings, [field]: value },
    }));
  };

  const getShipping = (field: string): string => content?.shippingContent?.[field] ?? "";
  const setShipping = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      shippingContent: { ...prev?.shippingContent, [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9] mx-auto" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-red-500">
        Impossible de charger le contenu du site.
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#4A90D9]" /> Contenu Site
          </h1>
          <p className="text-gray-500 mt-1">Bannière, contact, footer, livraison</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {saveMessage && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${saveMessage.includes("Erreur") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {saveMessage}
        </div>
      )}

      {/* Bannière */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Type className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Bannière en haut du site</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bandeau</label>
            <input type="text" value={get("topBanner")} onChange={(e) => set("topBanner", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
              placeholder="Livraison DOM-TOM — contactez-nous pour un devis personnalisé" />
            <p className="text-xs text-gray-400 mt-1">Affiché dans la barre bleue en haut du site. Laissez vide pour masquer.</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Phone className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Informations de contact</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
              <input type="email" value={get("contactEmail")} onChange={(e) => set("contactEmail", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="contact@97import.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={get("contactPhone")} onChange={(e) => set("contactPhone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="+596 596 00 00 00" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input type="tel" value={get("whatsappNumber")} onChange={(e) => set("whatsappNumber", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="+596696000000" />
              <p className="text-xs text-gray-400 mt-1">Format international sans espaces</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" value={get("contactAddress")} onChange={(e) => set("contactAddress", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="Fort-de-France, Martinique" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Layout className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Footer</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte copyright</label>
            <input type="text" value={get("footerText")} onChange={(e) => set("footerText", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
              placeholder="97 import — Tous droits réservés" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description footer</label>
            <textarea value={get("footerDescription")} onChange={(e) => set("footerDescription", e.target.value)}
              rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none resize-vertical"
              placeholder="Description de l'entreprise affichée dans le pied de page" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL TikTok</label>
              <input type="url" value={get("tiktokUrl")} onChange={(e) => set("tiktokUrl", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="https://www.tiktok.com/@votre-compte" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL YouTube</label>
              <input type="url" value={get("youtubeUrl")} onChange={(e) => set("youtubeUrl", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="https://www.youtube.com/@votre-chaine" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo header (URL)</label>
              <input type="text" value={get("headerLogo")} onChange={(e) => set("headerLogo", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="/images/logo_header.png" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo footer (URL)</label>
              <input type="text" value={get("footerLogo")} onChange={(e) => set("footerLogo", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
                placeholder="/images/logo_footer.png" />
            </div>
          </div>
        </div>
      </div>

      {/* Livraison DOM-TOM */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Livraison DOM-TOM</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre section livraison</label>
            <input type="text" value={getShipping("title")} onChange={(e) => setShipping("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
              placeholder="Livraison DOM-TOM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description livraison</label>
            <textarea value={getShipping("description")} onChange={(e) => setShipping("description", e.target.value)}
              rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none resize-vertical"
              placeholder="Informations sur les conditions de livraison vers les DOM-TOM…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message d'avertissement</label>
            <input type="text" value={getShipping("warning")} onChange={(e) => setShipping("warning", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none"
              placeholder="Contactez notre partenaire logistique pour les DOM-TOM" />
            <p className="text-xs text-gray-400 mt-1">Affiché sous les prix et dans le panier</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinations disponibles (une par ligne)</label>
            <textarea value={getShipping("destinations")} onChange={(e) => setShipping("destinations", e.target.value)}
              rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#4A90D9] outline-none resize-vertical"
              placeholder={"Martinique\nGuadeloupe\nGuyane\nLa Réunion\nMayotte"} />
          </div>
        </div>
      </div>
    </div>
  );
}
