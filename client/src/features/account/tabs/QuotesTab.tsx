import { useState, useEffect } from "react";
import { FileText, Loader2, ChevronRight, X, Download, CheckCircle2 } from "lucide-react";
import { generateDevisPDF, type DevisData } from "@/utils/generateDevisPDF";
import { generateFacturePDF, type FactureData } from "@/utils/generateFacturePDF";
import { formatEur } from "@/utils/calculPrix";
import { supabase } from "@/lib/supabase";
import { uploadPdfBlob } from "@/lib/storage";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  profile: any;
  role: string;
}

type Devis = {
  id: string;
  created_at: string;
  numero_devis?: string;
  produits?: any[];
  prix_total_calcule?: number;
  prix_negocie?: number;
  statut: string;
  facture_generee?: boolean;
  adresse_client?: string;
  ville_client?: string;
  pdf_url?: string | null;
  facture_url?: string | null;
};

const statutColors: Record<string, string> = {
  nouveau: "bg-blue-100 text-blue-700",
  en_cours: "bg-orange-100 text-orange-700",
  negociation: "bg-purple-100 text-purple-700",
  accepte: "bg-emerald-100 text-emerald-700",
  refuse: "bg-red-100 text-red-700",
};

const statutLabels: Record<string, string> = {
  nouveau: "Nouveau",
  en_cours: "En cours",
  negociation: "Négociation",
  accepte: "Accepté",
  refuse: "Refusé",
};

export default function QuotesTab({ user, profile, role }: Props) {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDevis = () => {
    if (!supabase) return;
    supabase
      .from("quotes")
      .select("id,created_at,numero_devis,produits,prix_total_calcule,prix_negocie,statut,facture_generee,adresse_client,ville_client,pdf_url,facture_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDevis((data as Devis[]) || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchDevis(); }, [user.id]);

  const handleValider = async (id: string) => {
    if (!supabase) return;
    setActionId(id);
    const { error } = await supabase
      .from("quotes")
      .update({ statut: "accepte", signe_le: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    setActionId(null);
    if (!error) {
      // Mise à jour locale immédiate — pas de refetch
      setDevis(prev => prev.map(d => d.id === id ? { ...d, statut: "accepte" } : d));
      setExpandedId(null);
      setActionMsg("Votre devis a été validé. Nous vous contactons sous 48h.");
      setTimeout(() => setActionMsg(null), 5000);
    }
  };

  const handleRefuser = async (id: string) => {
    if (!supabase) return;
    setActionId(id);
    const { error } = await supabase
      .from("quotes")
      .update({ statut: "refuse" })
      .eq("id", id)
      .eq("user_id", user.id);
    setActionId(null);
    if (!error) {
      // Mise à jour locale immédiate — pas de refetch
      setDevis(prev => prev.map(d => d.id === id ? { ...d, statut: "refuse" } : d));
      setExpandedId(null);
      setActionMsg("Devis refusé. N'hésitez pas à nous recontacter.");
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const downloadDevisPdf = async (d: Devis) => {
    // Si le PDF est déjà stocké dans Supabase, télécharger directement
    if (d.pdf_url) {
      window.open(d.pdf_url, "_blank");
      return;
    }

    // Sinon, régénérer le PDF à la volée
    const today = new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const rawProduits = d.produits;
    const produitsArr: any[] = Array.isArray(rawProduits)
      ? rawProduits
      : typeof rawProduits === "string"
        ? (() => { try { return JSON.parse(rawProduits); } catch { return []; } })()
        : [];
    const lignes = produitsArr.map((p: any) => {
      const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
      const qty = p.quantite ?? 1;
      return { nom: String(p.nom || p.name || p.id || "—"), description: p.description || "", prixUnitaire: pu, quantite: qty, total: Math.round(pu * qty) };
    });
    const numDevis = d.numero_devis || d.id.slice(0, 8).toUpperCase();
    const devisData: DevisData = {
      numeroDevis: numDevis,
      date: today,
      client: {
        nom: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email ?? "",
        adresse: d.adresse_client || "",
        ville: d.ville_client || "",
        pays: "France",
        email: user.email ?? "",
        telephone: profile?.phone || undefined,
      },
      produits: lignes,
      totalHT: d.prix_negocie ?? d.prix_total_calcule ?? 0,
      role: role ?? "user",
    };
    const blob = generateDevisPDF(devisData);

    // Téléchargement immédiat
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Devis_${numDevis}.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);

    // Upload asynchrone vers Supabase Storage + sauvegarde URL
    const pdfUrl = await uploadPdfBlob(blob, "devis", `Devis_${numDevis}`);
    if (pdfUrl && supabase) {
      await supabase.from("quotes").update({ pdf_url: pdfUrl }).eq("id", d.id);
      // Mettre à jour l'état local pour éviter re-génération
      setDevis(prev => prev.map(x => x.id === d.id ? { ...x, pdf_url: pdfUrl } : x));
    }
  };

  const downloadFacturePdf = async (d: Devis) => {
    // Si la facture est déjà stockée dans Supabase, télécharger directement
    if (d.facture_url) {
      window.open(d.facture_url, "_blank");
      return;
    }

    // Sinon, régénérer la facture à la volée
    const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const dateDevis = new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const rawProduitsF = d.produits;
    const produitsArr: any[] = Array.isArray(rawProduitsF)
      ? rawProduitsF
      : typeof rawProduitsF === "string"
        ? (() => { try { return JSON.parse(rawProduitsF); } catch { return []; } })()
        : [];
    const lignes = produitsArr.map((p: any) => {
      const pu = p.prixUnitaire ?? p.prixAffiche ?? 0;
      const qty = p.quantite ?? 1;
      return { nom: String(p.nom || p.name || p.id || "—"), prixUnitaire: pu, quantite: qty, total: Math.round(pu * qty) };
    });
    const factureNum = (d.numero_devis || "D00001").replace("D", "F");
    const factureData: FactureData = {
      numeroFacture: factureNum,
      dateFacture: today,
      numeroDevis: d.numero_devis,
      dateDevis,
      client: {
        nom: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user.email ?? "",
        adresse: d.adresse_client || "",
        ville: d.ville_client || "",
        pays: "France",
        email: user.email ?? "",
        telephone: profile?.phone || undefined,
      },
      produits: lignes,
      totalHT: d.prix_negocie ?? d.prix_total_calcule ?? 0,
    };
    const blob = generateFacturePDF(factureData);

    // Téléchargement immédiat
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Facture_${factureNum}.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);

    // Upload asynchrone vers Supabase Storage + sauvegarde URL
    const factureUrl = await uploadPdfBlob(blob, "factures", `Facture_${factureNum}`);
    if (factureUrl && supabase) {
      await supabase.from("quotes").update({ facture_url: factureUrl }).eq("id", d.id);
      setDevis(prev => prev.map(x => x.id === d.id ? { ...x, facture_url: factureUrl } : x));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes devis</h2>
      {actionMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 text-sm mb-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {actionMsg}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
        </div>
      ) : devis.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun devis pour le moment</p>
          <p className="text-gray-400 text-sm mt-1">Ajoutez des produits au panier et générez votre premier devis.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devis.map((d) => {
            const isExpanded = expandedId === d.id;
            const produits: any[] = Array.isArray(d.produits)
              ? d.produits
              : typeof d.produits === "string"
                ? (() => { try { return JSON.parse(d.produits); } catch { return []; } })()
                : [];
            return (
              <div key={d.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[#4A90D9] flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {d.numero_devis || `#${d.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColors[d.statut] ?? "bg-gray-100 text-gray-600"}`}>
                          {statutLabels[d.statut] ?? d.statut}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                        {" · "}{produits.length} produit{produits.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(d.prix_negocie ?? d.prix_total_calcule) != null && (
                      <span className="font-bold text-[#4A90D9] text-sm">
                        {formatEur(d.prix_negocie ?? d.prix_total_calcule ?? 0)}
                      </span>
                    )}
                    {isExpanded ? <X className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Numéro</p>
                        <p className="font-semibold text-gray-800">{d.numero_devis || `#${d.id.slice(0, 8).toUpperCase()}`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Statut</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statutColors[d.statut] ?? "bg-gray-100 text-gray-600"}`}>
                          {statutLabels[d.statut] ?? d.statut}
                        </span>
                      </div>
                    </div>

                    {produits.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Produits</p>
                        <div className="space-y-1.5">
                          {produits.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                              <span className="text-gray-700">{p.nom || p.name || "—"}{(p.quantite ?? 1) > 1 ? ` × ${p.quantite}` : ""}</span>
                              {(p.prixUnitaire ?? p.prixAffiche) ? (
                                <span className="font-medium text-gray-800">{formatEur((p.prixUnitaire ?? p.prixAffiche) * (p.quantite ?? 1))}</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-[#4A90D9] text-lg">
                        {formatEur(d.prix_negocie ?? d.prix_total_calcule ?? 0)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => downloadDevisPdf(d)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#4A90D9] text-[#4A90D9] text-xs font-semibold hover:bg-[#4A90D9]/5 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Télécharger le devis PDF
                      </button>
                      {d.facture_generee && (
                        <button
                          onClick={() => downloadFacturePdf(d)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Télécharger la facture PDF
                        </button>
                      )}
                    </div>

                    {["nouveau", "en_cours", "negociation"].includes(d.statut) && (
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleValider(d.id)}
                          disabled={actionId === d.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {actionId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Valider ce devis
                        </button>
                        <button
                          onClick={() => handleRefuser(d.id)}
                          disabled={actionId === d.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
