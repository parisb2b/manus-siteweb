import { useState, useEffect } from "react";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { formatEur } from "@/utils/calculPrix";
import { Loader2, RefreshCw, FileText, Download, CheckCircle2 } from "lucide-react";

interface Invoice {
  id: string;
  numero_facture: string;
  quote_id: string;
  date_facture: string;
  montant_ht: number;
  montant_acompte: number;
  type_facture: string;
  numero_acompte: number;
  statut: string;
  pdf_url: string | null;
  created_at: string;
  // joined
  quote_numero?: string;
  client_nom?: string;
  client_email?: string;
}

const STATUT_COLORS: Record<string, string> = {
  emise: "bg-blue-100 text-blue-700",
  payee: "bg-emerald-100 text-emerald-700",
  annulee: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<string, string> = {
  emise: "Émise",
  payee: "Payée",
  annulee: "Annulée",
};

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  acompte: "Acompte",
  solde: "Solde",
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*, quotes(numero_devis, nom, email)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInvoices(
        data.map((inv: any) => ({
          ...inv,
          quote_numero: inv.quotes?.numero_devis,
          client_nom: inv.quotes?.nom,
          client_email: inv.quotes?.email,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const updateStatut = async (id: string, statut: string) => {
    await supabase.from("invoices").update({ statut }).eq("id", id);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, statut } : inv))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A90D9]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Factures ({invoices.length})
        </h1>
        <button
          onClick={loadInvoices}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune facture pour le moment.</p>
          <p className="text-sm mt-2">
            Les factures sont générées depuis la page Devis/Commandes.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 font-medium">
                <th className="px-4 py-3">N° Facture</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Réf. Devis</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Montant HT</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-[#1E3A5F]">
                    {inv.numero_facture}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(inv.date_facture).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.client_nom || "—"}</div>
                    <div className="text-xs text-gray-400">
                      {inv.client_email}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">
                    {inv.quote_numero || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[inv.type_facture] || inv.type_facture}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatEur(inv.montant_ht)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUT_COLORS[inv.statut] || "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUT_LABELS[inv.statut] || inv.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {inv.statut === "emise" && (
                        <button
                          onClick={() => updateStatut(inv.id, "payee")}
                          className="text-emerald-600 hover:text-emerald-800"
                          title="Marquer payée"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="Télécharger PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
