import { useState, useEffect } from "react";
import { Save, Loader2, Globe } from "lucide-react";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import AdminPageLayout from "@/components/admin/AdminPageLayout";

interface SiteContent {
  id: string;
  section: string;
  content: any;
}

export default function AdminContenu() {
  const [sections, setSections] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingJson, setEditingJson] = useState<Record<string, string>>({});

  const load = async () => {
    if (!supabase) {
      setError("Supabase non configuré");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("Chargement trop long (timeout 8s)");
    }, 8000);
    try {
      const { data, error: err } = await supabase
        .from("site_content")
        .select("*")
        .order("section");
      if (err) throw new Error(err.message);
      setSections(data || []);
      const json: Record<string, string> = {};
      (data || []).forEach((s: SiteContent) => {
        json[s.id] = JSON.stringify(s.content, null, 2);
      });
      setEditingJson(json);
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (id: string) => {
    if (!supabase) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(editingJson[id]);
      const { error } = await supabase
        .from("site_content")
        .update({ content: parsed })
        .eq("id", id);
      if (error) throw new Error(error.message);
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, content: parsed } : s))
      );
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A90D9]" />
      </div>
    );
  }

  return (
    <AdminPageLayout title="Contenu du site" subtitle="Modifier le contenu CMS" onRefresh={load}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {sections.length === 0 && !error ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune section de contenu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 capitalize">{s.section}</h3>
                <button
                  onClick={() => handleSave(s.id)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 bg-[#4A90D9] hover:bg-[#357ABD] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Sauvegarder
                </button>
              </div>
              <textarea
                value={editingJson[s.id] || ""}
                onChange={(e) =>
                  setEditingJson((prev) => ({ ...prev, [s.id]: e.target.value }))
                }
                rows={12}
                className="w-full px-5 py-4 font-mono text-xs text-gray-700 bg-gray-50 border-0 focus:ring-0 outline-none resize-y"
                spellCheck={false}
              />
            </div>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
