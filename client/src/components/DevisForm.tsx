import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, FileText, Download } from "lucide-react";
import { formatEur, calculerPrix } from "@/utils/calculPrix";
import { generateDevisPDF, type DevisData } from "@/utils/generateDevisPDF";

interface PartnerOption {
  id: string;
  nom: string;
}

export interface DevisProduit {
  id: string;
  nom: string;
  quantite?: number;
  prixAffiche?: number;
  prixUnitaire?: number;
  prixAchat?: number;    // prix d'achat brut (pour calculer prixPublic ×2)
  prixPublic?: number;   // prix référence ×2 (pour barré VIP)
}

interface DevisFormProps {
  produits: DevisProduit[];
  prixTotalCalcule?: number;
  onSuccess?: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function getNextDevisNum(): Promise<string> {
  if (!supabase) {
    const year = new Date().getFullYear().toString().slice(-2);
    return `D${year}00001`;
  }
  // Utilise la séquence SQL serveur pour éviter tout doublon concurrent
  const { data, error } = await supabase.rpc("get_next_devis_numero");
  if (error || !data) {
    // Fallback basé sur timestamp si la fonction SQL n'existe pas encore
    const ts = Date.now().toString().slice(-6);
    const year = new Date().getFullYear().toString().slice(-2);
    return `D${year}${ts}`;
  }
  return data as string;
}

export default function DevisForm({ produits, prixTotalCalcule, onSuccess }: DevisFormProps) {
  const { user, profile, role } = useAuth();

  // Pré-remplir depuis le profil : informations personnelles + adresse facturation si disponible
  const [form, setForm] = useState({
    nom: profile
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : (user?.user_metadata?.full_name as string) ?? "",
    email: profile?.email ?? user?.email ?? "",
    telephone: profile?.phone ?? (user?.user_metadata?.phone as string) ?? "",
    adresse: profile?.adresse_facturation ?? "",
    ville: profile?.adresse_facturation
      ? `${profile.cp_facturation ?? ""} ${profile.ville_facturation ?? ""}`.trim()
      : "",
    pays: profile?.pays_facturation ?? "France",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [numeroDevis, setNumeroDevis] = useState("");
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedPartnerNom, setSelectedPartnerNom] = useState<string>("");

  // Post-devis flow state
  const [showPartenaireModal, setShowPartenaireModal] = useState(false);
  const [showAcompteModal, setShowAcompteModal] = useState(false);
  const [acompteStep, setAcompteStep] = useState<1 | 2 | 3>(1);
  const [acompteMontant, setAcompteMontant] = useState(500);
  const [compteType, setCompteType] = useState<"perso" | "pro">("perso");
  const [acompteSaving, setAcompteSaving] = useState(false);
  const [newQuoteId, setNewQuoteId] = useState<string | null>(null);
  const [allPartners, setAllPartners] = useState<{ id: string; nom: string }[]>([]);
  const [selectedNewPartner, setSelectedNewPartner] = useState<{ id: string; nom: string } | null>(null);
  const [adminParams, setAdminParams] = useState<Record<string, any>>({});

  // Charger les partenaires actifs pour la sélection (rôle partner ou admin/collaborateur)
  useEffect(() => {
    if (!supabase) return;
    if (role !== "partner" && role !== "admin" && role !== "collaborateur") return;
    supabase
      .from("partners")
      .select("id, nom")
      .eq("actif", true)
      .order("nom")
      .then(({ data }) => {
        const list = (data as PartnerOption[]) ?? [];
        setPartners(list);
        // Auto-sélectionner si l'utilisateur est partner et lié à un seul partenaire
        if (role === "partner" && list.length === 1) {
          setSelectedPartnerId(list[0].id);
          setSelectedPartnerNom(list[0].nom);
        }
      });
  }, [role]);

  // Charger tous les partenaires (pour le pop-up post-devis) et les admin_params
  useEffect(() => {
    if (!supabase) return;
    supabase.from("partners").select("id,nom").eq("actif", true).order("nom")
      .then(({ data }) => setAllPartners((data as any[]) || []));
    supabase.from("admin_params").select("*")
      .then(({ data }) => {
        const map: Record<string, any> = {};
        (data || []).forEach((p: any) => { map[p.key] = p.value; });
        setAdminParams(map);
      });
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email) {
      setError("Nom et email sont obligatoires.");
      return;
    }
    if (!form.adresse || !form.ville) {
      setError("Adresse et ville sont obligatoires pour générer le devis.");
      return;
    }
    if (!form.telephone) {
      setError("Le téléphone est obligatoire.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      let numero = await getNextDevisNum();
      // Appender le nom partenaire au numéro de devis si sélectionné
      if (selectedPartnerNom) {
        const shortCode = selectedPartnerNom.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
        numero = `${numero}-${shortCode}`;
      }
      setNumeroDevis(numero);

      const today = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });

      // Construire les lignes de produits pour le PDF
      const lignes: DevisData["produits"] = produits.map((p) => {
        const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
        const qty = p.quantite ?? 1;
        // Prix référence ×2 pour affichage barré VIP
        // Prix public ×2 via calculerPrix (source unique)
        const prixPublic = p.prixPublic ?? (p.prixAchat
          ? calculerPrix(p.prixAchat, "user").prixAffiche ?? undefined
          : undefined);
        const remise = prixPublic && prixPublic > pu
          ? Math.round((1 - pu / prixPublic) * 100)
          : undefined;
        return {
          nom: p.nom,
          prixUnitaire: pu,
          prixPublic,
          remise,
          quantite: qty,
          total: Math.round(pu * qty),
        };
      });

      // Total = somme exacte des lignes (jamais prixTotalCalcule séparé)
      const totalHT = lignes.reduce((s, l) => s + l.total, 0);

      const devisData: DevisData = {
        numeroDevis: numero,
        date: today,
        client: {
          nom: form.nom,
          adresse: form.adresse,
          ville: form.ville,
          pays: form.pays,
          email: form.email,
          telephone: form.telephone || undefined,
        },
        produits: lignes,
        totalHT,
        role: role ?? "user",
      };

      // Générer PDF
      const blob = generateDevisPDF(devisData);

      // Sauvegarder dans Supabase
      if (supabase) {
        const payload = {
          user_id: user?.id ?? null,
          email: form.email,
          nom: form.nom,
          telephone: form.telephone || null,
          message: form.message || null,
          produits: produits,
          prix_total_calcule: totalHT,
          role_client: role,
          statut: "nouveau",
          numero_devis: numero,
          adresse_client: form.adresse,
          ville_client: form.ville,
          pays_client: form.pays,
          partner_id: selectedPartnerId || null,
        };
        const { error: dbErr } = await supabase.from("quotes").insert(payload);
        if (dbErr) throw new Error(dbErr.message);

        // Sauvegarder téléphone si manquant
        if (user?.id && profile && !profile.phone && form.telephone) {
          await supabase.from("profiles").update({ phone: form.telephone }).eq("id", user.id);
        }
        // Sauvegarder adresse facturation si non encore renseignée dans le profil
        if (user?.id && profile && !profile.adresse_facturation && form.adresse) {
          const villeParts = form.ville.trim().split(/\s+/);
          const cp = villeParts.length > 1 && /^\d{5}/.test(villeParts[0]) ? villeParts[0] : "";
          const villeOnly = cp ? villeParts.slice(1).join(" ") : form.ville;
          await supabase.from("profiles").update({
            adresse_facturation: form.adresse,
            ville_facturation: villeOnly,
            cp_facturation: cp,
            pays_facturation: form.pays,
          }).eq("id", user.id);
        }
      }

      // Télécharger le PDF
      downloadBlob(blob, `Devis_${numero}.pdf`);

      // Clear cart
      try {
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cart');
        window.dispatchEvent(new Event('storage'));
      } catch {}

      // Get the quote ID from the insert
      if (supabase) {
        const { data: insertedQuote } = await supabase
          .from("quotes")
          .select("id")
          .eq("numero_devis", numero)
          .single();
        if (insertedQuote) {
          setNewQuoteId(insertedQuote.id);
        }
      }

      // Show partenaire modal (skip if already selected via partner role)
      if (selectedPartnerId) {
        setShowAcompteModal(true);
      } else {
        setShowPartenaireModal(true);
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handleSansPartenaire = () => {
    setShowPartenaireModal(false);
    setShowAcompteModal(true);
  };

  const handleConfirmPartenaire = async () => {
    if (!supabase || !newQuoteId || !selectedNewPartner) return;
    await supabase.from("quotes").update({
      partner_id: selectedNewPartner.id,
    }).eq("id", newQuoteId);
    setShowPartenaireModal(false);
    setShowAcompteModal(true);
  };

  const submitPostAcompte = async () => {
    if (!supabase || !newQuoteId) return;
    setAcompteSaving(true);
    const newAcompte = {
      numero: 1,
      montant: acompteMontant,
      type: compteType,
      statut: "en_attente",
      date: new Date().toISOString(),
    };
    await supabase.from("quotes").update({ acomptes: [newAcompte] }).eq("id", newQuoteId);

    // Send admin notification
    try {
      await sendEmail({
        to: "parisb2b@gmail.com",
        subject: `Virement client — ${numeroDevis} — À encaisser`,
        html: `<h2>Nouveau virement déclaré</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;">
            <tr><td style="padding:4px 12px;font-weight:bold;">Devis</td><td style="padding:4px 12px;">${numeroDevis}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Client</td><td style="padding:4px 12px;">${form.nom}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Email</td><td style="padding:4px 12px;">${form.email}</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Montant</td><td style="padding:4px 12px;">${acompteMontant.toLocaleString("fr-FR")} €</td></tr>
            <tr><td style="padding:4px 12px;font-weight:bold;">Type</td><td style="padding:4px 12px;">${compteType === "pro" ? "Professionnel" : "Personnel"}</td></tr>
          </table>`,
      });
    } catch { console.warn("[DevisForm] Email notification failed"); }

    setAcompteSaving(false);
    setShowAcompteModal(false);
    window.location.href = "/mon-compte.html";
  };

  if (success) {
    return (
      <div>
        <div className="text-center py-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Devis {numeroDevis} généré !</h3>
          <p className="text-gray-500 text-sm">
            Votre devis a été téléchargé et enregistré dans votre espace client.
          </p>
        </div>

        {/* POP-UP PARTENAIRE */}
        {showPartenaireModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px',
              padding: '24px', maxWidth: '420px', width: '90%',
            }}>
              <h3 style={{ color: '#1E3A5F', margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>
                Avez-vous un partenaire commercial ?
              </h3>
              <p style={{ color: '#6B7280', fontSize: '12px', margin: '0 0 20px' }}>
                Si un de nos partenaires vous a recommandé 97import, sélectionnez-le ci-dessous.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {allPartners.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedNewPartner(p)}
                    style={{
                      background: selectedNewPartner?.id === p.id ? '#7C3AED' : '#F3F4F6',
                      color: selectedNewPartner?.id === p.id ? '#fff' : '#374151',
                      border: 'none', borderRadius: '8px',
                      padding: '10px 20px', fontSize: '13px',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {p.nom}
                  </button>
                ))}
                {allPartners.length === 0 && (
                  <p style={{ color: '#9CA3AF', fontSize: '12px' }}>Aucun partenaire disponible</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSansPartenaire}
                  style={{
                    flex: 1, background: '#F9FAFB',
                    color: '#6B7280', border: '0.5px solid #E5E7EB',
                    borderRadius: '8px', padding: '10px',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  Sans partenaire
                </button>
                {selectedNewPartner && (
                  <button
                    onClick={handleConfirmPartenaire}
                    style={{
                      flex: 1, background: '#7C3AED',
                      color: '#fff', border: 'none',
                      borderRadius: '8px', padding: '10px',
                      fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Confirmer {selectedNewPartner.nom} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* POP-UP ACOMPTE */}
        {showAcompteModal && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}>
            <div style={{
              background: '#fff', borderRadius: '12px',
              padding: '24px', maxWidth: '420px', width: '90%',
              maxHeight: '85vh', overflowY: 'auto',
            }}>
              {/* Steps indicator */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{
                    flex: 1, height: '3px', borderRadius: '2px',
                    background: s <= acompteStep ? '#EA580C' : '#E5E7EB',
                  }} />
                ))}
              </div>

              {/* STEP 1 - Montant */}
              {acompteStep === 1 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
                    Étape 1 — Montant du virement
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B7280' }}>Total devis</span>
                    <span style={{ fontWeight: 600 }}>{formatEur(prixTotalCalcule || 0)}</span>
                  </div>
                  <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                    Montant à virer (€)
                  </label>
                  <input
                    type="number"
                    value={acompteMontant}
                    onChange={(e) => setAcompteMontant(Number(e.target.value))}
                    min={1}
                    style={{
                      width: '100%', padding: '10px', border: '1px solid #D1D5DB', borderRadius: '6px',
                      fontSize: '16px', fontWeight: 700, textAlign: 'center', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setAcompteStep(2)}
                    disabled={acompteMontant <= 0}
                    style={{
                      width: '100%', background: '#EA580C', color: '#fff', border: 'none',
                      borderRadius: '6px', padding: '10px', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', marginTop: '12px',
                    }}
                  >
                    Continuer →
                  </button>
                  <button
                    onClick={() => { setShowAcompteModal(false); window.location.href = '/mon-compte.html'; }}
                    style={{
                      width: '100%', background: 'none', border: '1px solid #D1D5DB',
                      borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#6B7280',
                      cursor: 'pointer', marginTop: '8px',
                    }}
                  >
                    Plus tard → accéder à mes devis
                  </button>
                </div>
              )}

              {/* STEP 2 - Type compte */}
              {acompteStep === 2 && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
                    Étape 2 — Type de compte
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(["perso", "pro"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => { setCompteType(t); setAcompteStep(3); }}
                        style={{
                          flex: 1, padding: '16px', border: `2px solid ${compteType === t ? '#EA580C' : '#E5E7EB'}`,
                          borderRadius: '8px', background: compteType === t ? '#FFF7ED' : '#fff',
                          cursor: 'pointer', textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>{t === 'perso' ? '👤' : '🏢'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                          {t === 'perso' ? 'Compte particulier' : 'Compte professionnel'}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setAcompteStep(1)}
                    style={{
                      width: '100%', background: 'none', border: '1px solid #D1D5DB',
                      borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#6B7280',
                      cursor: 'pointer', marginTop: '12px',
                    }}
                  >
                    ← Retour
                  </button>
                </div>
              )}

              {/* STEP 3 - RIB */}
              {acompteStep === 3 && (() => {
                const ribKey = compteType === 'pro' ? 'rib_pro' : 'rib_perso';
                const emKey = compteType === 'pro' ? 'emetteur_pro' : 'emetteur_perso';
                const rib = adminParams[ribKey] || adminParams['rib'] || {};
                const emetteur = adminParams[emKey] || adminParams['emetteur'] || {};
                const ref = numeroDevis ? 'FA' + numeroDevis.replace(/^D/, '') : '';
                return (
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
                      Étape 3 — Coordonnées bancaires
                    </h3>
                    <div style={{
                      background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
                      padding: '14px', fontSize: '12px', marginBottom: '12px',
                    }}>
                      {emetteur.nom && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#6B7280', fontSize: '10px' }}>Bénéficiaire</span>
                          <p style={{ fontWeight: 600, color: '#111827', margin: '2px 0 0' }}>{emetteur.nom}</p>
                        </div>
                      )}
                      {rib.iban && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#6B7280', fontSize: '10px' }}>IBAN</span>
                          <p style={{ fontWeight: 600, color: '#111827', margin: '2px 0 0', fontFamily: 'monospace' }}>{rib.iban}</p>
                        </div>
                      )}
                      {rib.bic && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{ color: '#6B7280', fontSize: '10px' }}>BIC</span>
                          <p style={{ fontWeight: 600, color: '#111827', margin: '2px 0 0', fontFamily: 'monospace' }}>{rib.bic}</p>
                        </div>
                      )}
                      <div>
                        <span style={{ color: '#6B7280', fontSize: '10px' }}>Référence à indiquer</span>
                        <p style={{ fontWeight: 700, color: '#EA580C', margin: '2px 0 0', fontSize: '14px' }}>{ref}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
                      <span style={{ color: '#6B7280' }}>Montant à virer</span>
                      <span style={{ fontWeight: 700, color: '#EA580C' }}>{formatEur(acompteMontant)}</span>
                    </div>
                    {rib.pdf_url && (
                      <a href={rib.pdf_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'block', textAlign: 'center', background: '#EFF6FF',
                          border: '1px solid #BFDBFE', borderRadius: '6px', padding: '8px',
                          color: '#1E3A5F', fontSize: '12px', fontWeight: 600,
                          textDecoration: 'none', marginBottom: '8px',
                        }}>
                        📄 Télécharger le RIB PDF
                      </a>
                    )}
                    <button
                      onClick={submitPostAcompte}
                      disabled={acompteSaving}
                      style={{
                        width: '100%', background: '#059669', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '12px', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer', opacity: acompteSaving ? 0.6 : 1,
                      }}
                    >
                      {acompteSaving ? 'Enregistrement...' : "J'ai effectué le virement ✓"}
                    </button>
                    <button
                      onClick={() => setAcompteStep(2)}
                      style={{
                        width: '100%', background: 'none', border: '1px solid #D1D5DB',
                        borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#6B7280',
                        cursor: 'pointer', marginTop: '6px',
                      }}
                    >
                      ← Retour
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Récapitulatif produits */}
      {produits.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Produits demandés
          </p>
          <ul className="space-y-1">
            {produits.map((p) => (
              <li key={p.id} className="flex justify-between text-sm text-gray-700">
                <span>{p.nom}{p.quantite && p.quantite > 1 ? ` ×${p.quantite}` : ""}</span>
                {p.prixAffiche != null && (
                  <span className="font-semibold text-[#4A90D9]">
                    {formatEur(p.prixAffiche)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {prixTotalCalcule != null && (
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
              <span>Total HT</span>
              <span className="text-[#4A90D9]">{formatEur(prixTotalCalcule)}</span>
            </div>
          )}
        </div>
      )}

      {/* Nom + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nom}
            onChange={set("nom")}
            required
            placeholder="Jean Dupont"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            placeholder="jean@exemple.fr"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={form.telephone}
          onChange={set("telephone")}
          required
          placeholder="+596 696 00 00 00"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
        />
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.adresse}
          onChange={set("adresse")}
          required
          placeholder="12 rue des Fleurs"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
        />
      </div>

      {/* Ville + Pays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville / Code postal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.ville}
            onChange={set("ville")}
            required
            placeholder="97200 Fort-de-France"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
          <select
            value={form.pays}
            onChange={set("pays")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] bg-white"
          >
            <option>France</option>
            <option>Martinique</option>
            <option>Guadeloupe</option>
            <option>Guyane</option>
            <option>La Réunion</option>
            <option>Mayotte</option>
            <option>Nouvelle-Calédonie</option>
            <option>Polynésie française</option>
            <option>Saint-Martin</option>
            <option>Saint-Barthélemy</option>
            <option>Belgique</option>
            <option>Suisse</option>
            <option>Canada</option>
            <option>Autre</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={3}
          placeholder="Précisions sur votre projet, délai souhaité…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90D9] resize-none"
        />
      </div>

      {/* Sélection du partenaire (visible pour partner, admin, collaborateur) */}
      {partners.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Partenaire apporteur d'affaire
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setSelectedPartnerId(null); setSelectedPartnerCode(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedPartnerId
                  ? "bg-[#4A90D9] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Direct (aucun)
            </button>
            {partners.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPartnerId(p.id); setSelectedPartnerNom(p.nom); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedPartnerId === p.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.nom}
              </button>
            ))}
          </div>
          {selectedPartnerNom && (
            <p className="text-xs text-gray-400 mt-1">
              Partenaire : {selectedPartnerNom}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-bold"
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Génération du devis…</>
        ) : (
          <><FileText className="h-5 w-5 mr-2" /><Download className="h-4 w-4 mr-1" /> Générer et télécharger mon devis</>
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Le devis sera téléchargé immédiatement et enregistré dans votre espace client.
      </p>
    </form>
  );
}
