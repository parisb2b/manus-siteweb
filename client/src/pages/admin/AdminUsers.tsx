import { useState, useEffect } from "react";
import { Users, Download, AlertCircle, Search } from "lucide-react";

interface UserRecord {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_inscription: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Try to dynamically import supabase
        const supabaseModule = await import("../../lib/supabase").catch(() => null);
        if (supabaseModule && supabaseModule.supabase) {
          const { data, error } = await supabaseModule.supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data) {
            setUsers(
              data.map((u: any) => ({
                id: u.id,
                nom: u.nom || u.last_name || "",
                prenom: u.prenom || u.first_name || "",
                email: u.email || "",
                telephone: u.telephone || u.phone || "",
                date_inscription: u.created_at || u.date_inscription || "",
              }))
            );
            setConnected(true);
          } else {
            setConnected(false);
          }
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ["Nom", "Prénom", "Email", "Téléphone", "Date d'inscription"];
    const rows = users.map((u) => [
      u.nom,
      u.prenom,
      u.email,
      u.telephone,
      u.date_inscription
        ? new Date(u.date_inscription).toLocaleDateString("fr-FR")
        : "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gestion des utilisateurs inscrits</p>
        </div>
        {connected && users.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 bg-[#4A90D9] hover:bg-[#357ABD] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
            Exporter CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          Chargement...
        </div>
      ) : !connected ? (
        /* Not connected to Supabase */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Base de données non connectée
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Connectez Supabase pour voir les utilisateurs inscrits. Configurez les
              variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 w-full text-left">
              <p className="text-xs font-mono text-gray-600">
                VITE_SUPABASE_URL=votre_url
                <br />
                VITE_SUPABASE_ANON_KEY=votre_cle
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Connected - show users */
        <>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A90D9] focus:border-transparent outline-none text-gray-800"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {searchTerm
                  ? "Aucun utilisateur ne correspond à votre recherche."
                  : "Aucun utilisateur inscrit pour le moment."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">Nom</th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">
                        Prénom
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600 hidden md:table-cell">
                        Téléphone
                      </th>
                      <th className="text-left px-6 py-3 font-semibold text-gray-600 hidden lg:table-cell">
                        Date d'inscription
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{user.nom}</td>
                        <td className="px-6 py-4 text-gray-600">{user.prenom}</td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                          {user.telephone || "---"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">
                          {user.date_inscription
                            ? new Date(user.date_inscription).toLocaleDateString("fr-FR")
                            : "---"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer count */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? "s" : ""}{" "}
                {searchTerm && `(sur ${users.length} au total)`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
