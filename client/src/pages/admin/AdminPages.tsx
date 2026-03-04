import { useState, useEffect } from "react";
import { FileText, Save, ChevronRight, Plus, Trash2 } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  home: "Accueil",
  minipelles: "Mini-pelles",
  maisons: "Maisons",
  solaire: "Solaire",
  agricole: "Agricole",
  accessoires: "Accessoires",
  services: "Services",
  delivery: "Livraison",
  terms: "CGV",
  privacy: "Confidentialit\u00e9",
  legal: "Mentions l\u00e9gales",
};

const PAGE_KEYS = Object.keys(PAGE_LABELS);

const CATALOG_PAGES = ["home", "minipelles", "maisons", "solaire", "agricole", "accessoires"];
const LEGAL_PAGES = ["terms", "privacy", "legal"];
const INFO_PAGES = ["services", "delivery"];

export default function AdminPages() {
  const [siteContent, setSiteContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedPage, setSelectedPage] = useState("home");

  useEffect(() => {
    fetch("/api/site-content")
      .then((res) => res.json())
      .then((data) => {
        setSiteContent(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteContent),
      });
      if (res.ok) {
        setSaveMessage("Contenu des pages sauvegard\u00e9 avec succ\u00e8s");
      } else {
        setSaveMessage("Erreur lors de la sauvegarde");
      }
    } catch {
      setSaveMessage("Erreur lors de la sauvegarde");
    }
    setSaving(false);
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
              Section CTA (appel \u00e0 l'action)
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

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
          Section Confiance
        </h3>
      </div>
      {renderInputField("Titre de la section confiance", "trustTitle")}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            \u00c9l\u00e9ments de confiance
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
                \u00c9l\u00e9ment {index + 1}
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
                placeholder="Titre de l'\u00e9l\u00e9ment"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                type="text"
                value={item.description || ""}
                onChange={(e) => updateTrustItem(index, "description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800 text-sm"
                placeholder="Description de l'\u00e9l\u00e9ment"
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

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contenu des Pages</h1>
          <p className="text-gray-500 mt-1">
            G\u00e9rez les textes et contenus de chaque page du site
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

      {/* Main layout: sidebar + editor */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Page list */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Pages
              </h2>
            </div>
            <nav className="py-1">
              {PAGE_KEYS.map((key) => {
                const isActive = selectedPage === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPage(key)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-[#4A90D9]/10 text-[#4A90D9] font-semibold border-r-2 border-[#4A90D9]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className={`w-4 h-4 ${isActive ? "text-[#4A90D9]" : "text-gray-400"}`} />
                      <span>{PAGE_LABELS[key]}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#4A90D9]" />}
                  </button>
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
            </div>
            <div className="px-6 py-6 space-y-5">{renderPageEditor()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
