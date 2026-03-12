import { useState, useEffect } from "react";
import { Users, Mail, Phone, MessageSquare, Calendar, Archive, RefreshCw, ExternalLink } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  product_id?: string;
  created_at: string;
  read: boolean;
  archived: boolean;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      setSupabaseConfigured(true);
      loadLeads();
    } else {
      setLoading(false);
    }
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/contacts?order=created_at.desc`, {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setLeads(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const filteredLeads = leads.filter(l => {
    if (filter === "unread") return !l.read && !l.archived;
    if (filter === "archived") return l.archived;
    return !l.archived;
  });

  const unreadCount = leads.filter(l => !l.read && !l.archived).length;

  if (!supabaseConfigured) {
    return (
      <div className="font-sans">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Contacts & Leads</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Supabase non configuré</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Pour recevoir et visualiser les contacts/leads, vous devez configurer Supabase.
          </p>
          <div className="bg-gray-50 rounded-xl p-6 text-left max-w-lg mx-auto space-y-3">
            <p className="text-sm font-semibold text-gray-700">Étapes de configuration :</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Créer un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#4A90D9] hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>Exécuter le fichier <code className="bg-gray-100 px-1 rounded">supabase.sql</code> dans l'éditeur SQL Supabase</li>
              <li>Copier <code className="bg-gray-100 px-1 rounded">.env.example</code> vers <code className="bg-gray-100 px-1 rounded">.env</code></li>
              <li>Renseigner <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> et <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
              <li>Redémarrer le serveur de développement</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Contacts & Leads</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? (
              <span className="text-amber-600 font-medium">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</span>
            ) : (
              "Tous les messages lus"
            )}
          </p>
        </div>
        <button
          onClick={loadLeads}
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {(["all", "unread", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? "bg-[#4A90D9] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "Tous" : f === "unread" ? "Non lus" : "Archivés"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500">Chargement...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">{error}</div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun contact pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                !lead.read ? "border-[#4A90D9]/30 bg-blue-50/20" : "border-gray-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{lead.name}</span>
                    {!lead.read && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#4A90D9] text-white px-2 py-0.5 rounded-full">
                        Nouveau
                      </span>
                    )}
                    {lead.source && (
                      <span className="text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {lead.source}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-[#4A90D9] transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {lead.email}
                    </a>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#4A90D9] transition-colors">
                        <Phone className="w-3.5 h-3.5" /> {lead.phone}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(lead.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  {lead.message && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {lead.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
