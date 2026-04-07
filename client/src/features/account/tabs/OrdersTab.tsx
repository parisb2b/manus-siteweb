import { useState, useEffect } from "react";
import { ShoppingBag, Loader2, ChevronRight, X, Download } from "lucide-react";
import { formatEur } from "@/utils/calculPrix";
import { adminQuery } from "@/lib/adminQuery";
import type { AuthUser } from "@/contexts/AuthContext";

interface Props {
  user: AuthUser;
}

export default function OrdersTab({ user }: Props) {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    adminQuery("quotes", {
      eq: { user_id: user.uid, statut: "accepte" },
      order: { column: "created_at", ascending: false },
    }).then(({ data, error }) => {
      if (error) setCommandes([]);
      else setCommandes(data || []);
      setLoading(false);
    });
  }, [user.uid]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes commandes</h2>
      <p className="text-sm text-gray-400 mb-8">Devis validés — en cours de préparation.</p>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#4A90D9]" />
        </div>
      ) : commandes.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucune commande confirmée pour le moment</p>
          <p className="text-gray-400 text-sm mt-1">Vos devis validés apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commandes.map((cmd: any) => {
            const isExpanded = expandedId === cmd.id;
            const produits: any[] = Array.isArray(cmd.produits) ? cmd.produits : [];
            return (
              <div key={cmd.id} className="border border-emerald-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cmd.id)}
                  className="w-full flex items-center justify-between p-5 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-gray-900 text-sm">
                        {cmd.numero_devis || `#${cmd.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Confirmé</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(cmd.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(cmd.prix_negocie ?? cmd.prix_total_calcule) != null && (
                      <span className="font-bold text-emerald-600 text-sm">
                        {formatEur(cmd.prix_negocie ?? cmd.prix_total_calcule ?? 0)}
                      </span>
                    )}
                    {isExpanded ? <X className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 border-t border-emerald-100 bg-white space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Numéro</p>
                        <p className="font-semibold text-gray-800">{cmd.numero_devis || `#${cmd.id.slice(0, 8).toUpperCase()}`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(cmd.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      {(cmd.adresse_client || cmd.ville_client) && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400 mb-0.5">Adresse de livraison</p>
                          <p className="text-gray-700">{[cmd.adresse_client, cmd.ville_client].filter(Boolean).join(", ")}</p>
                        </div>
                      )}
                    </div>

                    {produits.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Produits</p>
                        <div className="space-y-1.5">
                          {produits.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                              <span className="text-gray-700">{p.nom || p.name || "—"}{p.quantite > 1 ? ` × ${p.quantite}` : ""}</span>
                              {(p.prixUnitaire ?? p.prixAffiche) ? (
                                <span className="font-medium text-gray-800">{formatEur((p.prixUnitaire ?? p.prixAffiche) * (p.quantite ?? 1))}</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total confirmé</span>
                      <span className="font-bold text-emerald-600 text-lg">
                        {formatEur(cmd.prix_negocie ?? cmd.prix_total_calcule ?? 0)}
                      </span>
                    </div>

                    {cmd.facture_generee && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" /> Facture disponible dans l'onglet "Mes devis"
                      </p>
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
