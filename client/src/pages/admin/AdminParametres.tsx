import { useState, useEffect, useRef } from "react";
import { Save, Building2, CreditCard, Percent, Settings, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import { PRICE_MULTIPLIERS } from "@/features/pricing/model/pricing";

interface AdminParam {
  key: string;
  value: any;
  label?: string;
}

function EmetteurCard({
  title,
  data,
  onChange,
}: {
  title: string;
  data: any;
  onChange: (d: any) => void;
}) {
  const set = (field: string, value: string) => onChange({ ...data, [field]: value });
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-[#4A90D9]" />
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale / Nom</label>
            <input type="text" value={data.nom ?? ""} onChange={(e) => set("nom", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="97 IMPORT / LUXENT LIMITED" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={data.email ?? ""} onChange={(e) => set("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="contact@97import.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input type="text" value={data.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="123 rue Example" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville / CP</label>
            <input type="text" value={data.ville ?? ""} onChange={(e) => set("ville", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="75001 Paris" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <input type="text" value={data.pays ?? ""} onChange={(e) => set("pays", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="France" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="text" value={data.telephone ?? ""} onChange={(e) => set("telephone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="+33 1 23 45 67 89" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIRET / N° entreprise</label>
            <input type="text" value={data.siret ?? ""} onChange={(e) => set("siret", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="XXX XXX XXX XXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TVA Intracommunautaire</label>
            <input type="text" value={data.tva_intra ?? ""} onChange={(e) => set("tva_intra", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="FRXX XXXXXXXXX" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RibCard({
  title,
  data,
  onChange,
  pdfUrl,
  onPdfUpload,
  uploading,
}: {
  title: string;
  data: any;
  onChange: (d: any) => void;
  pdfUrl?: string;
  onPdfUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (field: string, value: string) => onChange({ ...data, [field]: value });
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-[#4A90D9]" />
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banque</label>
          <input type="text" value={data.banque ?? ""} onChange={(e) => set("banque", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="Banque Example" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titulaire</label>
          <input type="text" value={data.titulaire ?? ""} onChange={(e) => set("titulaire", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="NOM PRENOM / RAISON SOCIALE" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
          <input type="text" value={data.iban ?? ""} onChange={(e) => set("iban", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BIC / SWIFT</label>
          <input type="text" value={data.bic ?? ""} onChange={(e) => set("bic", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#4A90D9] outline-none" placeholder="XXXXXXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF du RIB</label>
          <div className="flex items-center gap-3">
            <input type="file" ref={fileRef} accept=".pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPdfUpload(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Upload..." : "Téléverser PDF"}
            </button>
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4A90D9] hover:underline">
                Voir le RIB PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminParametres() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Émetteurs
  const [emetteurPro, setEmetteurPro] = useState<any>({});
  const [emetteurPerso, setEmetteurPerso] = useState<any>({});

  // RIB
  const [ribPro, setRibPro] = useState<any>({});
  const [ribPerso, setRibPerso] = useState<any>({});
  const [ribProPdfUrl, setRibProPdfUrl] = useState("");
  const [ribPersoPdfUrl, setRibPersoPdfUrl] = useState("");
  const [uploadingPro, setUploadingPro] = useState(false);
  const [uploadingPerso, setUploadingPerso] = useState(false);

  // Acomptes
  const [acompteMontant, setAcompteMontant] = useState<number>(30);
  const [acompteMaxNb, setAcompteMaxNb] = useState<number>(3);

  // Multiplicateurs (lecture seule — modifiables en code)
  const multipliers = PRICE_MULTIPLIERS;

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("admin_params").select("*").then(({ data }) => {
      const params = (data as AdminParam[]) ?? [];
      for (const p of params) {
        if (p.key === "emetteur" || p.key === "emetteur_pro") setEmetteurPro(p.value ?? {});
        if (p.key === "emetteur_perso") setEmetteurPerso(p.value ?? {});
        if (p.key === "rib" || p.key === "rib_pro") {
          setRibPro(p.value ?? {});
          if (p.value?.pdf_url) setRibProPdfUrl(p.value.pdf_url);
        }
        if (p.key === "rib_perso") {
          setRibPerso(p.value ?? {});
          if (p.value?.pdf_url) setRibPersoPdfUrl(p.value.pdf_url);
        }
        if (p.key === "acompte_defaut") {
          setAcompteMontant(p.value?.pourcentage ?? 30);
          setAcompteMaxNb(p.value?.max_nb ?? 3);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    setSaveMessage("");
    const now = new Date().toISOString();
    const results = await Promise.all([
      supabase.from("admin_params").upsert({ key: "emetteur_pro", value: emetteurPro, label: "Émetteur professionnel", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "emetteur_perso", value: emetteurPerso, label: "Émetteur personnel", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "rib_pro", value: { ...ribPro, pdf_url: ribProPdfUrl || undefined }, label: "RIB professionnel", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "rib_perso", value: { ...ribPerso, pdf_url: ribPersoPdfUrl || undefined }, label: "RIB personnel", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "acompte_defaut", value: { pourcentage: acompteMontant, max_nb: acompteMaxNb }, label: "Config acomptes", updated_at: now }),
      // Maintenir compatibilité avec l'ancien key "emetteur" et "rib"
      supabase.from("admin_params").upsert({ key: "emetteur", value: emetteurPro, label: "Émetteur (compat)", updated_at: now }),
      supabase.from("admin_params").upsert({ key: "rib", value: { ...ribPro, pdf_url: ribProPdfUrl || undefined }, label: "RIB (compat)", updated_at: now }),
    ]);
    const hasError = results.some((r) => r.error);
    setSaving(false);
    setSaveMessage(hasError ? "Erreur lors de la sauvegarde" : "Paramètres sauvegardés");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const uploadRibPdf = async (file: File, type: "pro" | "perso") => {
    if (type === "pro") setUploadingPro(true);
    else setUploadingPerso(true);
    try {
      const url = await uploadFile(file, "ribs");
      if (url) {
        if (type === "pro") setRibProPdfUrl(url);
        else setRibPersoPdfUrl(url);
      }
    } catch { /* silent */ }
    if (type === "pro") setUploadingPro(false);
    else setUploadingPerso(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9] mx-auto" />
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#4A90D9]" /> Paramètres
          </h1>
          <p className="text-gray-500 mt-1">Émetteurs, RIB, acomptes, multiplicateurs</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      {saveMessage && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${saveMessage.includes("Erreur") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {saveMessage}
        </div>
      )}

      {/* Émetteur Professionnel */}
      <EmetteurCard title="Émetteur professionnel (factures, devis)" data={emetteurPro} onChange={setEmetteurPro} />

      {/* Émetteur Personnel */}
      <EmetteurCard title="Émetteur personnel" data={emetteurPerso} onChange={setEmetteurPerso} />

      {/* RIB Professionnel */}
      <RibCard title="RIB professionnel" data={ribPro} onChange={setRibPro}
        pdfUrl={ribProPdfUrl} onPdfUpload={(f) => uploadRibPdf(f, "pro")} uploading={uploadingPro} />

      {/* RIB Personnel */}
      <RibCard title="RIB personnel" data={ribPerso} onChange={setRibPerso}
        pdfUrl={ribPersoPdfUrl} onPdfUpload={(f) => uploadRibPdf(f, "perso")} uploading={uploadingPerso} />

      {/* Configuration acomptes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Percent className="w-5 h-5 text-[#4A90D9]" />
          <h2 className="text-lg font-semibold text-gray-800">Configuration acomptes</h2>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage acompte par défaut</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={acompteMontant}
                  onChange={(e) => setAcompteMontant(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Appliqué lors de la génération des factures d'acompte</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre max d'acomptes</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={10} value={acompteMaxNb}
                  onChange={(e) => setAcompteMaxNb(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#4A90D9] outline-none" />
                <span className="text-sm text-gray-500">acomptes</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Nombre maximum de factures d'acompte par devis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multiplicateurs prix (lecture seule) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Percent className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-800">Multiplicateurs prix</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Public (user)</p>
              <p className="text-2xl font-bold text-[#4A90D9]">×{multipliers.user}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Partenaire</p>
              <p className="text-2xl font-bold text-orange-500">×{multipliers.partner}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">VIP (fallback)</p>
              <p className="text-2xl font-bold text-purple-600">×{multipliers.vip}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Ces multiplicateurs sont définis dans le code source (features/pricing/model/pricing.ts)</p>
        </div>
      </div>
    </div>
  );
}
