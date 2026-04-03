import { useState, useEffect, useRef } from "react";
import { Save, Building2, CreditCard, Percent, Settings, Upload, Loader2 } from "lucide-react";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import { PRICE_MULTIPLIERS } from "@/features/pricing/model/pricing";
import { ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton } from "@/components/admin/AdminUI";

interface AdminParam {
  key: string;
  value: any;
  label?: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${ADMIN_COLORS.navyBorder}`,
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
  background: '#fff',
  color: ADMIN_COLORS.navy,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: ADMIN_COLORS.grayTextDark,
  marginBottom: '4px',
};

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
    <AdminCard style={{ marginBottom: '24px' }}>
      <AdminCardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 style={{ width: 18, height: 18, color: '#fff' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{title}</span>
        </div>
      </AdminCardHeader>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Raison sociale / Nom</label>
            <input type="text" value={data.nom ?? ""} onChange={(e) => set("nom", e.target.value)}
              style={inputStyle} placeholder="97 IMPORT / LUXENT LIMITED" />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={data.email ?? ""} onChange={(e) => set("email", e.target.value)}
              style={inputStyle} placeholder="contact@97import.com" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Adresse</label>
          <input type="text" value={data.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)}
            style={inputStyle} placeholder="123 rue Example" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Ville / CP</label>
            <input type="text" value={data.ville ?? ""} onChange={(e) => set("ville", e.target.value)}
              style={inputStyle} placeholder="75001 Paris" />
          </div>
          <div>
            <label style={labelStyle}>Pays</label>
            <input type="text" value={data.pays ?? ""} onChange={(e) => set("pays", e.target.value)}
              style={inputStyle} placeholder="France" />
          </div>
          <div>
            <label style={labelStyle}>Telephone</label>
            <input type="text" value={data.telephone ?? ""} onChange={(e) => set("telephone", e.target.value)}
              style={inputStyle} placeholder="+33 1 23 45 67 89" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>SIRET / N. entreprise</label>
            <input type="text" value={data.siret ?? ""} onChange={(e) => set("siret", e.target.value)}
              style={inputStyle} placeholder="XXX XXX XXX XXXXX" />
          </div>
          <div>
            <label style={labelStyle}>TVA Intracommunautaire</label>
            <input type="text" value={data.tva_intra ?? ""} onChange={(e) => set("tva_intra", e.target.value)}
              style={inputStyle} placeholder="FRXX XXXXXXXXX" />
          </div>
        </div>
      </div>
    </AdminCard>
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
    <AdminCard style={{ marginBottom: '24px' }}>
      <AdminCardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard style={{ width: 18, height: 18, color: '#fff' }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{title}</span>
        </div>
      </AdminCardHeader>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Banque</label>
          <input type="text" value={data.banque ?? ""} onChange={(e) => set("banque", e.target.value)}
            style={inputStyle} placeholder="Banque Example" />
        </div>
        <div>
          <label style={labelStyle}>Titulaire</label>
          <input type="text" value={data.titulaire ?? ""} onChange={(e) => set("titulaire", e.target.value)}
            style={inputStyle} placeholder="NOM PRENOM / RAISON SOCIALE" />
        </div>
        <div>
          <label style={labelStyle}>IBAN</label>
          <input type="text" value={data.iban ?? ""} onChange={(e) => set("iban", e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
        </div>
        <div>
          <label style={labelStyle}>BIC / SWIFT</label>
          <input type="text" value={data.bic ?? ""} onChange={(e) => set("bic", e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace' }} placeholder="XXXXXXXX" />
        </div>
        <div>
          <label style={labelStyle}>PDF du RIB</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="file" ref={fileRef} accept=".pdf" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPdfUpload(f); }} />
            <AdminButton variant="ghost" size="md" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {uploading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 16, height: 16 }} />}
                {uploading ? "Upload..." : "Televerser PDF"}
              </span>
            </AdminButton>
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '13px', color: ADMIN_COLORS.navyAccent, textDecoration: 'none' }}>
                Voir le RIB PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

export default function AdminParametres() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
    let timeout: ReturnType<typeof setTimeout>;
    const loadParams = async () => {
      try {
        timeout = setTimeout(() => {
          setLoadError("Chargement trop long (timeout 8s)");
          setLoading(false);
        }, 8000);
        const { data, error } = await supabase.from("admin_params").select("*");
        if (error) throw error;
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
      } catch (err: any) {
        setLoadError(err.message ?? "Erreur de chargement des paramètres");
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    loadParams();
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
      <AdminCard style={{ padding: '48px', textAlign: 'center' }}>
        <Loader2 style={{ width: 32, height: 32, color: ADMIN_COLORS.navyAccent, margin: '0 auto', animation: 'spin 1s linear infinite' }} />
      </AdminCard>
    );
  }

  if (loadError) {
    return (
      <AdminCard style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: ADMIN_COLORS.redText, fontSize: '14px', fontWeight: 500 }}>{loadError}</p>
      </AdminCard>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: ADMIN_COLORS.navy, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Settings style={{ width: 24, height: 24, color: ADMIN_COLORS.navyAccent }} /> Parametres
          </h1>
          <p style={{ color: ADMIN_COLORS.grayText, marginTop: '4px', fontSize: '14px' }}>Emetteurs, RIB, acomptes, multiplicateurs</p>
        </div>
        <AdminButton variant="primary" size="md" onClick={handleSave} disabled={saving}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {saving ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 18, height: 18 }} />}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </span>
        </AdminButton>
      </div>

      {saveMessage && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          background: saveMessage.includes("Erreur") ? ADMIN_COLORS.redBg : ADMIN_COLORS.greenBg,
          color: saveMessage.includes("Erreur") ? ADMIN_COLORS.redText : ADMIN_COLORS.greenText,
          border: `1px solid ${saveMessage.includes("Erreur") ? ADMIN_COLORS.redBorder : ADMIN_COLORS.greenBorder}`,
        }}>
          {saveMessage}
        </div>
      )}

      {/* Émetteur Professionnel */}
      <EmetteurCard title="Emetteur professionnel (factures, devis)" data={emetteurPro} onChange={setEmetteurPro} />

      {/* Émetteur Personnel */}
      <EmetteurCard title="Emetteur personnel" data={emetteurPerso} onChange={setEmetteurPerso} />

      {/* RIB Professionnel */}
      <RibCard title="RIB professionnel" data={ribPro} onChange={setRibPro}
        pdfUrl={ribProPdfUrl} onPdfUpload={(f) => uploadRibPdf(f, "pro")} uploading={uploadingPro} />

      {/* RIB Personnel */}
      <RibCard title="RIB personnel" data={ribPerso} onChange={setRibPerso}
        pdfUrl={ribPersoPdfUrl} onPdfUpload={(f) => uploadRibPdf(f, "perso")} uploading={uploadingPerso} />

      {/* Règle des acomptes — info seulement */}
      <div style={{
        background: '#F9FAFB', border: '0.5px solid #E5E7EB', borderRadius: '6px',
        padding: '10px 14px', fontSize: '11px', color: '#6B7280', marginBottom: '24px',
      }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151' }}>
          Règle des acomptes
        </p>
        <p style={{ margin: 0 }}>
          Maximum 3 acomptes par devis. Le client choisit librement le montant de chaque acompte.
          Au 3ème acompte, un message l'informera que le prochain paiement devra solder la totalité.
        </p>
      </div>

      {/* Multiplicateurs prix (lecture seule) */}
      <AdminCard style={{ marginBottom: '24px' }}>
        <AdminCardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Percent style={{ width: 18, height: 18, color: '#fff' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Multiplicateurs prix</span>
          </div>
        </AdminCardHeader>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ background: ADMIN_COLORS.infoBg, borderRadius: '8px', padding: '16px', textAlign: 'center', border: `1px solid ${ADMIN_COLORS.infoBorder}` }}>
              <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, marginBottom: '4px', marginTop: 0 }}>Public (user)</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: ADMIN_COLORS.infoBtn, margin: 0 }}>x{multipliers.user}</p>
            </div>
            <div style={{ background: ADMIN_COLORS.orangeBg, borderRadius: '8px', padding: '16px', textAlign: 'center', border: `1px solid ${ADMIN_COLORS.orangeBorder}` }}>
              <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, marginBottom: '4px', marginTop: 0 }}>Partenaire</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: ADMIN_COLORS.orangeBtn, margin: 0 }}>x{multipliers.partner}</p>
            </div>
            <div style={{ background: ADMIN_COLORS.purpleBg, borderRadius: '8px', padding: '16px', textAlign: 'center', border: `1px solid ${ADMIN_COLORS.purpleBorder}` }}>
              <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, marginBottom: '4px', marginTop: 0 }}>VIP (fallback)</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: ADMIN_COLORS.purpleBtn, margin: 0 }}>x{multipliers.vip}</p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: ADMIN_COLORS.grayText, marginTop: '12px' }}>Ces multiplicateurs sont definis dans le code source (features/pricing/model/pricing.ts)</p>
        </div>
      </AdminCard>
    </div>
  );
}
