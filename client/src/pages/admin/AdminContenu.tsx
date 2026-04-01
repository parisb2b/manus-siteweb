import { useState, useEffect } from "react";
import { Save, Globe, Loader2, Type, Phone, Truck, Layout } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ADMIN_COLORS, AdminCard, AdminCardHeader, AdminButton } from "@/components/admin/AdminUI";

export default function AdminContenu() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*");

      if (error) {
        console.error('Erreur chargement contenu:', error);
        setContent(null);
        setLoadError('Impossible de charger : ' + error.message);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Try single-row format first (key="site_content")
        const singleRow = data.find((r: any) => r.key === "site_content");
        if (singleRow?.value && typeof singleRow.value === "object") {
          setContent(singleRow.value);
        } else {
          // Multi-row format: each key is a section
          const assembled: any = { siteSettings: {}, shippingContent: {} };
          for (const row of data) {
            if (row.key === "banniere") assembled.siteSettings.topBanner = row.value?.texte || "";
            if (row.key === "contact") {
              assembled.siteSettings.contactEmail = row.value?.email || "";
              assembled.siteSettings.contactPhone = row.value?.telephone || "";
              assembled.siteSettings.whatsappNumber = row.value?.whatsapp || "";
              assembled.siteSettings.contactAddress = row.value?.adresse || "";
            }
            if (row.key === "footer") {
              assembled.siteSettings.footerText = row.value?.mentions || "";
              assembled.siteSettings.footerDescription = row.value?.description || "";
              assembled.siteSettings.tiktokUrl = row.value?.tiktok || "";
              assembled.siteSettings.youtubeUrl = row.value?.youtube || "";
            }
            if (row.key === "livraison" || row.key === "shipping") {
              assembled.shippingContent = row.value || {};
            }
          }
          setContent(assembled);
        }
      } else {
        // No data at all — initialize with empty content so form shows
        setContent({ siteSettings: {}, shippingContent: {} });
      }

      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!supabase || !content) return;
    setSaving(true);
    const now = new Date().toISOString();

    // Save in single-row format (main)
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "site_content", value: content, updated_at: now });

    // Also save in multi-row format for compatibility
    const s = content.siteSettings || {};
    const multiRows = [
      { key: "banniere", value: { texte: s.topBanner || "" }, updated_at: now },
      { key: "contact", value: { email: s.contactEmail || "", telephone: s.contactPhone || "", whatsapp: s.whatsappNumber || "", adresse: s.contactAddress || "" }, updated_at: now },
      { key: "footer", value: { mentions: s.footerText || "", description: s.footerDescription || "", tiktok: s.tiktokUrl || "", youtube: s.youtubeUrl || "" }, updated_at: now },
      { key: "livraison", value: content.shippingContent || {}, updated_at: now },
    ];
    await supabase.from("site_content").upsert(multiRows);

    setSaving(false);
    setSaveMessage(error ? "Erreur : " + error.message : "Contenu sauvegardé");
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

  // Shared styles
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: ADMIN_COLORS.grayTextDark,
    marginBottom: '4px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: `1px solid ${ADMIN_COLORS.navyBorder}`,
    borderRadius: '6px',
    outline: 'none',
    background: '#fff',
    color: ADMIN_COLORS.navy,
    boxSizing: 'border-box' as const,
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical' as const,
  };

  const helperStyle: React.CSSProperties = {
    fontSize: '11px',
    color: ADMIN_COLORS.grayText,
    marginTop: '4px',
  };

  const sectionBodyStyle: React.CSSProperties = {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  };

  if (loading) {
    return (
      <AdminCard style={{ padding: '48px', textAlign: 'center' }}>
        <Loader2 style={{ height: 32, width: 32, color: ADMIN_COLORS.navyAccent, margin: '0 auto' }} className="animate-spin" />
      </AdminCard>
    );
  }

  if (!content) {
    return (
      <AdminCard style={{ padding: '48px', textAlign: 'center', color: ADMIN_COLORS.redText }}>
        {loadError || "Impossible de charger le contenu du site."}
      </AdminCard>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: ADMIN_COLORS.navy, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Globe style={{ width: 22, height: 22, color: ADMIN_COLORS.navyAccent }} /> Contenu Site
          </h1>
          <p style={{ color: ADMIN_COLORS.grayText, marginTop: '4px', fontSize: '13px' }}>Bannière, contact, footer, livraison</p>
        </div>
        <AdminButton onClick={handleSave} disabled={saving} variant="primary" size="md">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {saving ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Save style={{ width: 16, height: 16 }} />}
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </span>
        </AdminButton>
      </div>

      {/* Save message */}
      {saveMessage && (
        <div style={{
          marginBottom: '16px',
          padding: '10px 16px',
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

      {/* Bannière */}
      <AdminCard style={{ marginBottom: '20px' }}>
        <AdminCardHeader>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            <Type style={{ width: 18, height: 18 }} /> Bannière en haut du site
          </span>
        </AdminCardHeader>
        <div style={sectionBodyStyle}>
          <div>
            <label style={labelStyle}>Texte du bandeau</label>
            <input type="text" value={get("topBanner")} onChange={(e) => set("topBanner", e.target.value)}
              style={inputStyle}
              placeholder="Livraison DOM-TOM — contactez-nous pour un devis personnalisé" />
            <p style={helperStyle}>Affiché dans la barre bleue en haut du site. Laissez vide pour masquer.</p>
          </div>
        </div>
      </AdminCard>

      {/* Contact */}
      <AdminCard style={{ marginBottom: '20px' }}>
        <AdminCardHeader>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            <Phone style={{ width: 18, height: 18 }} /> Informations de contact
          </span>
        </AdminCardHeader>
        <div style={sectionBodyStyle}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Email de contact</label>
              <input type="email" value={get("contactEmail")} onChange={(e) => set("contactEmail", e.target.value)}
                style={inputStyle}
                placeholder="contact@97import.com" />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input type="tel" value={get("contactPhone")} onChange={(e) => set("contactPhone", e.target.value)}
                style={inputStyle}
                placeholder="+596 596 00 00 00" />
            </div>
          </div>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input type="tel" value={get("whatsappNumber")} onChange={(e) => set("whatsappNumber", e.target.value)}
                style={inputStyle}
                placeholder="+596696000000" />
              <p style={helperStyle}>Format international sans espaces</p>
            </div>
            <div>
              <label style={labelStyle}>Adresse</label>
              <input type="text" value={get("contactAddress")} onChange={(e) => set("contactAddress", e.target.value)}
                style={inputStyle}
                placeholder="Fort-de-France, Martinique" />
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Footer */}
      <AdminCard style={{ marginBottom: '20px' }}>
        <AdminCardHeader>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            <Layout style={{ width: 18, height: 18 }} /> Footer
          </span>
        </AdminCardHeader>
        <div style={sectionBodyStyle}>
          <div>
            <label style={labelStyle}>Texte copyright</label>
            <input type="text" value={get("footerText")} onChange={(e) => set("footerText", e.target.value)}
              style={inputStyle}
              placeholder="97 import — Tous droits réservés" />
          </div>
          <div>
            <label style={labelStyle}>Description footer</label>
            <textarea value={get("footerDescription")} onChange={(e) => set("footerDescription", e.target.value)}
              rows={3} style={textareaStyle}
              placeholder="Description de l'entreprise affichée dans le pied de page" />
          </div>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>URL TikTok</label>
              <input type="url" value={get("tiktokUrl")} onChange={(e) => set("tiktokUrl", e.target.value)}
                style={inputStyle}
                placeholder="https://www.tiktok.com/@votre-compte" />
            </div>
            <div>
              <label style={labelStyle}>URL YouTube</label>
              <input type="url" value={get("youtubeUrl")} onChange={(e) => set("youtubeUrl", e.target.value)}
                style={inputStyle}
                placeholder="https://www.youtube.com/@votre-chaine" />
            </div>
          </div>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Logo header (URL)</label>
              <input type="text" value={get("headerLogo")} onChange={(e) => set("headerLogo", e.target.value)}
                style={inputStyle}
                placeholder="/images/logo_header.png" />
            </div>
            <div>
              <label style={labelStyle}>Logo footer (URL)</label>
              <input type="text" value={get("footerLogo")} onChange={(e) => set("footerLogo", e.target.value)}
                style={inputStyle}
                placeholder="/images/logo_footer.png" />
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Livraison DOM-TOM */}
      <AdminCard style={{ marginBottom: '20px' }}>
        <AdminCardHeader>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>
            <Truck style={{ width: 18, height: 18 }} /> Livraison DOM-TOM
          </span>
        </AdminCardHeader>
        <div style={sectionBodyStyle}>
          <div>
            <label style={labelStyle}>Titre section livraison</label>
            <input type="text" value={getShipping("title")} onChange={(e) => setShipping("title", e.target.value)}
              style={inputStyle}
              placeholder="Livraison DOM-TOM" />
          </div>
          <div>
            <label style={labelStyle}>Description livraison</label>
            <textarea value={getShipping("description")} onChange={(e) => setShipping("description", e.target.value)}
              rows={4} style={textareaStyle}
              placeholder="Informations sur les conditions de livraison vers les DOM-TOM…" />
          </div>
          <div>
            <label style={labelStyle}>Message d'avertissement</label>
            <input type="text" value={getShipping("warning")} onChange={(e) => setShipping("warning", e.target.value)}
              style={inputStyle}
              placeholder="Contactez notre partenaire logistique pour les DOM-TOM" />
            <p style={helperStyle}>Affiché sous les prix et dans le panier</p>
          </div>
          <div>
            <label style={labelStyle}>Destinations disponibles (une par ligne)</label>
            <textarea value={getShipping("destinations")} onChange={(e) => setShipping("destinations", e.target.value)}
              rows={5} style={{ ...textareaStyle, fontFamily: 'monospace' }}
              placeholder={"Martinique\nGuadeloupe\nGuyane\nLa Réunion\nMayotte"} />
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
