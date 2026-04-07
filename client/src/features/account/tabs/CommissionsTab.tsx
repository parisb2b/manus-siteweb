import { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import { formatEur } from "@/utils/calculPrix";
import { adminQuery } from "@/lib/adminQuery";
import type { AuthUser } from "@/contexts/AuthContext";

interface Props {
  user: AuthUser;
}

export default function CommissionsTab({ user }: Props) {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminQuery("partners", { eq: { user_id: user.uid }, limit: 1 })
      .then(async ({ data: partners }) => {
        const partner = partners[0];
        if (!partner) { setCommissions([]); setLoading(false); return; }
        const { data } = await adminQuery("quotes", {
          eq: { partner_id: partner.id },
          order: { column: "created_at", ascending: false },
        });
        setCommissions(data ?? []);
        setLoading(false);
      });
  }, [user.uid]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Mes commissions</h2>
      <p className="text-sm text-gray-400 mb-6">Suivi des commissions sur les devis qui vous sont attribués.</p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium">Aucune commission pour le moment</p>
          <p className="text-sm mt-1">Les devis qui vous seront attribués apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total commissions dues</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatEur(commissions.filter((c) => !c.commission_payee).reduce((s: number, c: any) => s + (c.commission_montant ?? 0), 0))}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total commissions payées</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatEur(commissions.filter((c) => c.commission_payee).reduce((s: number, c: any) => s + (c.commission_montant ?? 0), 0))}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {commissions.map((c: any) => (
              <div key={c.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-800">{c.numero_devis || c.id.slice(0, 8)}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="text-gray-600 text-sm">{c.nom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600">{c.commission_montant ? formatEur(c.commission_montant) : "—"}</span>
                    {c.commission_payee ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Payée</span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-700 font-medium px-2 py-0.5 rounded-full">En attente</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  <span>Prix négocié : {formatEur(c.prix_negocie ?? c.prix_total_calcule ?? 0)}</span>
                </div>
                {c.commission_pdf_url && (
                  <a href={c.commission_pdf_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-orange-500 font-medium hover:underline">
                    <Download className="h-3.5 w-3.5" /> Télécharger note de commission
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
