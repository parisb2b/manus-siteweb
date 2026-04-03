/**
 * Helpers pour la table quotes — parsing JSON produits/acomptes
 */

// ── Produit principal ──────────────────────────────────────
export function getProduitPrincipal(produits: any): string {
  try {
    const arr = typeof produits === 'string' ? JSON.parse(produits) : produits;
    if (!Array.isArray(arr) || !arr.length) return 'Produit non défini';
    return arr[0]?.nom || arr[0]?.name || arr[0]?.designation || 'Produit';
  } catch {
    return 'Produit';
  }
}

// ── Liste produits parsée ──────────────────────────────────
export function getProduitsList(produits: any): Array<{
  nom: string;
  ref?: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  options?: any[];
}> {
  try {
    const arr = typeof produits === 'string' ? JSON.parse(produits) : produits;
    if (!Array.isArray(arr)) return [];
    return arr.map((p: any) => ({
      nom: p.nom || p.name || p.designation || 'Produit',
      ref: p.reference || p.ref || p.reference_interne || undefined,
      quantite: p.quantite || p.qty || p.qte || 1,
      prix_unitaire: p.prix_unitaire || p.prix || p.price || 0,
      prix_total: p.prix_total || p.total || (p.prix_unitaire || 0) * (p.quantite || 1),
      options: p.options || [],
    }));
  } catch {
    return [];
  }
}

// ── Acompte — statut du dernier ────────────────────────────
export function getAcompteStatut(acomptes: any): string {
  try {
    const arr = typeof acomptes === 'string' ? JSON.parse(acomptes) : acomptes;
    if (!Array.isArray(arr) || !arr.length) return 'aucun';
    const dernier = arr[arr.length - 1];
    return dernier?.statut || 'aucun';
  } catch {
    return 'aucun';
  }
}

// ── Acompte — montant total encaissé ───────────────────────
export function getAcompteMontant(acomptes: any): number {
  try {
    const arr = typeof acomptes === 'string' ? JSON.parse(acomptes) : acomptes;
    if (!Array.isArray(arr) || !arr.length) return 0;
    return arr.reduce((sum: number, a: any) => sum + (a.montant || 0), 0);
  } catch {
    return 0;
  }
}

// ── Acompte — liste complète parsée ────────────────────────
export function getAcompteList(acomptes: any): Array<{
  montant: number;
  statut: string;
  date_declaration?: string;
  date_encaissement?: string;
  type_paiement?: string;
}> {
  try {
    const arr = typeof acomptes === 'string' ? JSON.parse(acomptes) : acomptes;
    if (!Array.isArray(arr)) return [];
    return arr.map((a: any) => ({
      montant: a.montant || 0,
      statut: a.statut || 'en_attente',
      date_declaration: a.date_declaration || a.created_at,
      date_encaissement: a.date_encaissement || a.encaisse_at,
      type_paiement: a.type_paiement || a.type || undefined,
    }));
  } catch {
    return [];
  }
}

// ── Format montant ─────────────────────────────────────────
export function formatMontant(montant: number | null | undefined): string {
  if (montant == null || isNaN(montant)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

// ── Statut label français ──────────────────────────────────
const STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  negociation: 'Négociation',
  accepte: 'Accepté',
  refuse: 'Refusé',
  non_conforme: 'Non conforme',
  en_attente: 'En attente',
  declare: 'Déclaré',
  encaisse: 'Encaissé',
  valide: 'Validé',
  aucun: 'Aucun',
};

export function getStatutLabel(statut: string): string {
  return STATUT_LABELS[statut] || statut;
}

// ── Statut couleur CSS ─────────────────────────────────────
const STATUT_COLORS: Record<string, string> = {
  nouveau: 'bg-gray-100 text-gray-700',
  en_cours: 'bg-blue-100 text-blue-700',
  negociation: 'bg-amber-100 text-amber-700',
  accepte: 'bg-emerald-100 text-emerald-700',
  refuse: 'bg-red-100 text-red-700',
  non_conforme: 'bg-red-200 text-red-800',
  en_attente: 'bg-gray-100 text-gray-600',
  declare: 'bg-orange-100 text-orange-700',
  encaisse: 'bg-emerald-100 text-emerald-700',
  valide: 'bg-emerald-200 text-emerald-800',
  aucun: 'bg-gray-50 text-gray-400',
};

export function getStatutColor(statut: string): string {
  return STATUT_COLORS[statut] || 'bg-gray-100 text-gray-600';
}
