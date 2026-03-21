import { useState } from "react";
import { Lock, Eye, EyeOff, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function SecurityTab() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handleUpdatePassword = async () => {
    if (!supabase) return;
    if (newPassword.length < 6) {
      setPwdError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("La confirmation ne correspond pas au mot de passe saisi.");
      return;
    }
    setPwdLoading(true);
    setPwdError(null);
    setPwdSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwdSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: unknown) {
      setPwdError((err as Error).message || "Erreur lors de la mise à jour");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sécurité</h2>
      <p className="text-sm text-gray-400 mb-6">Modifiez votre mot de passe de connexion.</p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Règles du mot de passe</p>
        <ul className="space-y-1 text-sm text-blue-700">
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Minimum 6 caractères</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Lettres seules acceptées (ex. : monmotdepasse)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Chiffres seuls acceptés (ex. : 123456)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Mélange lettres + chiffres accepté (ex. : import97)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Caractères spéciaux non obligatoires</li>
        </ul>
      </div>

      {pwdSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 mb-6">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Mot de passe mis à jour avec succès.</span>
        </div>
      )}
      {pwdError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{pwdError}</span>
        </div>
      )}

      <div className="max-w-md space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showNewPwd ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères (ex. : import97)"
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
            />
            <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showConfirmPwd ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:border-[#4A90D9] focus:ring-2 focus:ring-[#4A90D9]/20 outline-none transition-all text-gray-900"
            />
            <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          onClick={handleUpdatePassword}
          disabled={pwdLoading || !newPassword || !confirmPassword}
          className="bg-[#4A90D9] hover:bg-[#3a7bc8] text-white font-bold py-5 px-8"
        >
          {pwdLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</>
          ) : (
            <><Shield className="mr-2 h-4 w-4" />Mettre à jour le mot de passe</>
          )}
        </Button>
      </div>
    </div>
  );
}
