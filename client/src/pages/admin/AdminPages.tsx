import { useState, useEffect } from "react";
import { FileText, Save, ChevronRight, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PAGE_LABELS: Record<string, string> = {
  home: "Accueil",
  minipelles: "Mini-pelles",
  maisons: "Maisons",
  solaire: "Solaire",
  agricole: "Agricole",
  accessoires: "Accessoires",
  services: "Services",
  delivery: "Livraison",
  contact: "Contact",
  about: "À propos",
  terms: "CGV",
  privacy: "Confidentialité",
  legal: "Mentions légales",
};

const PAGE_KEYS = Object.keys(PAGE_LABELS);

// Pages that cannot be disabled (always active)
const NON_DISABLABLE_PAGES = ["home"];

const CATALOG_PAGES = ["home", "minipelles", "maisons", "solaire", "agricole", "accessoires"];
const LEGAL_PAGES = ["terms", "privacy", "legal"];
const INFO_PAGES = ["services", "delivery", "contact", "about"];

export default function AdminPages() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedPage, setSelectedPage] = useState("home");

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
          if (!d.pagesConfig) {
            d.pagesConfig = {};
          }
          setSiteContent(d);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "site_content", value: siteContent, updated_at: new Date().toISOString() });
    setSaving(false);
    setSaveMessage(error ? "Erreur lors de la sauvegarde" : "Contenu des pages sauvegardé avec succès");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const updatePageField = (pageKey: string, fieldName: string, value: any) => {
    setSiteContent((prev: any) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...prev.pages[pageKey],
          [fieldName]: value,
        },
      },
    }));
  };

  const togglePageEnabled = (pageKey: string) => {
    setSiteContent((prev: any) => {
      const currentConfig = prev.pagesConfig?.[pageKey] || { enabled: true, label: PAGE_LABELS[pageKey] };
      return {
        ...prev,
        pagesConfig: {
          ...prev.pagesConfig,
          [pageKey]: {
            ...currentConfig,
            enabled: !currentConfig.enabled,
          },
        },
      };
    });
  };

  const isPageEnabled = (pageKey: string): boolean => {
    return siteContent?.pagesConfig?.[pageKey]?.enabled ?? true;
  };

  const updateTrustItem = (index: number, field: string, value: string) => {
    setSiteContent((prev: any) => {
      const items = [...(prev.pages.home.trustItems || [])];
      items[index] = { ...items[index], [field]: value };
      return {
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            trustItems: items,
          },
        },
      };
    });
  };

  const addTrustItem = () => {
    setSiteContent((prev: any) => {
      const items = [...(prev.pages.home.trustItems || [])];
      items.push({ title: "", description: "", icon: "check" });
      return {
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            trustItems: items,
          },
        },
      };
    });
  };

  const removeTrustItem = (index: number) => {
    setSiteContent((prev: any) => {
      const items = [...(prev.pages.home.trustItems || [])];
      items.splice(index, 1);
      return {
        ...prev,
        pages: {
          ...prev.pages,
          home: {
            ...prev.pages.home,
            trustItems: items,
          },
        },
      };
    });
  };

  if (loading || !siteContent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500 font-sans">
        Chargement du contenu des pages...
      </div>
    );
  }

  const page = siteContent.pages?.[selectedPage] || {};

  const renderInputField = (label: string, fieldName: string, placeholder?: string) => (
    <div key={fieldName}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={page[fieldName] || ""}
        onChange={(e) => updatePageField(selectedPage, fieldName, e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
        placeholder={placeholder || label}
      />
    </div>
  );

  const renderTextareaField = (label: string, fieldName: string, rows = 4, placeholder?: string) => (
    <div key={fieldName}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={page[fieldName] || ""}
        onChange={(e) => updatePageField(selectedPage, fieldName, e.target.value)}
        rows={rows}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 resize-y"
        placeholder={placeholder || label}
      />
    </div>
  );

  const renderCatalogFields = () => (
    <>
      {renderInputField("Titre de la page", "pageTitle")}
      {renderInputField("Sous-titre de la page", "pageSubtitle")}
      {page.ctaTitle !== undefined && (
        <>
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Section CTA (appel à l'action)
            </h3>
          </div>
          {renderInputField("Titre CTA", "ctaTitle")}
          {renderTextareaField("Description CTA", "ctaDescription", 3)}
          {renderInputField("Texte du bouton CTA", "ctaButtonText")}
          {renderInputField("Lien du bouton CTA", "ctaButtonLink", "/accessoires")}
        </>
      )}
    </>
  );

  const renderHomeFields = () => (
    <>
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
          Section Hero
        </h3>
      </div>
      {renderInputField("Titre Hero", "heroTitle")}
      {renderInputField("Sous-titre Hero", "heroSubtitle")}
      {renderInputField("Texte du bouton Hero", "heroButtonText")}
      {renderInputField("Lien du bouton Hero", "heroButtonLink", "/minipelles")}

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
          Section Confiance
        </h3>
      </div>
      {renderInputField("Titre de la section confiance", "trustTitle")}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Éléments de confiance
          </label>
          <button
            type="button"
            onClick={addTrustItem}
            className="inline-flex items-center gap-1.5 text-sm text-[#4A90D9] hover:text-[#357ABD] font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        {(page.trustItems || []).map((item: any, index: number) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Élément {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeTrustItem(index)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
              <input
                type="text"
                value={item.title || ""}
                onChange={(e) => updateTrustItem(index, "title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 text-sm"
                placeholder="Titre de l'élément"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={item.description || ""}
                onChange={(e) => updateTrustItem(index, "description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 text-sm"
                placeholder="Description de l'élément"
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderAgricoleFields = () => (
    <>
      {renderCatalogFields()}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
          Page en maintenance
        </h3>
      </div>
      {renderInputField("Titre maintenance", "comingSoonTitle")}
      {renderTextareaField("Description maintenance", "comingSoonDescription", 3)}
    </>
  );

  const renderLegalFields = () => (
    <>
      {renderInputField("Titre de la page", "pageTitle")}
      {renderTextareaField("Contenu HTML", "content", 16, "<h3>Titre</h3><p>Contenu...</p>")}
      <p className="text-xs text-gray-400 -mt-2">
        Vous pouvez utiliser du HTML : &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
      </p>
    </>
  );

  const renderInfoFields = () => (
    <>
      {renderInputField("Titre de la page", "pageTitle")}
      {renderInputField("Sous-titre de la page", "pageSubtitle")}
      {renderInputField("Description courte", "description")}
    </>
  );

  const renderPageEditor = () => {
    if (selectedPage === "home") {
      return renderHomeFields();
    }
    if (selectedPage === "agricole") {
      return renderAgricoleFields();
    }
    if (LEGAL_PAGES.includes(selectedPage)) {
      return renderLegalFields();
    }
    if (INFO_PAGES.includes(selectedPage)) {
      return renderInfoFields();
    }
    if (CATALOG_PAGES.includes(selectedPage)) {
      return renderCatalogFields();
    }
    return null;
  };

  const enabledCount = PAGE_KEYS.filter(key => isPageEnabled(key)).length;
  const disabledCount = PAGE_KEYS.length - enabledCount;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contenu des Pages</h1>
          <p className="text-gray-500 mt-1">
            Gérez les textes et la visibilité de chaque page du site
          </p>
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

      {/* Stats bar */}
      {disabledCount > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-2">
          <EyeOff className="w-4 h-4" />
          {disabledCount} page{disabledCount > 1 ? "s" : ""} désactivée{disabledCount > 1 ? "s" : ""} — {enabledCount} active{enabledCount > 1 ? "s" : ""}
        </div>
      )}

      {/* Main layout: sidebar + editor */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Page list */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Pages
              </h2>
            </div>
            <nav className="py-1">
              {PAGE_KEYS.map((key) => {
                const isActive = selectedPage === key;
                const enabled = isPageEnabled(key);
                const canToggle = !NON_DISABLABLE_PAGES.includes(key);
                return (
                  <div
                    key={key}
                    className={`flex items-center transition-colors ${
                      isActive
                        ? "bg-[#4A90D9]/10 border-r-2 border-[#4A90D9]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedPage(key)}
                      className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 text-sm text-left ${
                        isActive
                          ? "text-[#4A90D9] font-semibold"
                          : enabled
                            ? "text-gray-700"
                            : "text-gray-400"
                      }`}
                    >
                      <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#4A90D9]" : enabled ? "text-gray-400" : "text-gray-300"}`} />
                      <span className={!enabled ? "line-through" : ""}>{PAGE_LABELS[key]}</span>
                      {!enabled && (
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          Off
                        </span>
                      )}
                    </button>
                    {canToggle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePageEnabled(key);
                        }}
                        className={`p-2 mr-2 rounded-lg transition-colors flex-shrink-0 ${
                          enabled
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={enabled ? "Page active — cliquer pour désactiver" : "Page désactivée — cliquer pour activer"}
                      >
                        {enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#4A90D9]" />
              <h2 className="text-lg font-semibold text-gray-800">
                {PAGE_LABELS[selectedPage]}
              </h2>
              {!isPageEnabled(selectedPage) && !NON_DISABLABLE_PAGES.includes(selectedPage) && (
                <span className="ml-2 text-xs font-bold uppercase tracking-wider bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Page désactivée
                </span>
              )}
            </div>
            {!isPageEnabled(selectedPage) && !NON_DISABLABLE_PAGES.includes(selectedPage) && (
              <div className="mx-6 mt-4 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-2">
                <EyeOff className="w-4 h-4 flex-shrink-0" />
                <span>
                  Cette page est désactivée. Elle n'est pas visible sur le site.
                  Vous pouvez modifier son contenu pour le préparer avant réactivation.
                </span>
              </div>
            )}
            <div className="px-6 py-6 space-y-5">{renderPageEditor()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
