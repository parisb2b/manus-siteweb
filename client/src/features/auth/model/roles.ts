/**
 * roles.ts — Définition centralisée des rôles utilisateurs
 * SOURCE UNIQUE pour les rôles dans tout le projet.
 */

export const ROLES = [
  "visitor",
  "user",
  "vip",
  "partner",
  "collaborateur",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  visitor:      "Visiteur",
  user:         "Utilisateur",
  vip:          "VIP",
  partner:      "Partenaire",
  collaborateur:"Collaborateur",
  admin:        "Admin",
};

export const ROLE_COLORS: Record<Role, string> = {
  visitor:      "bg-gray-100 text-gray-500",
  user:         "bg-gray-100 text-gray-600",
  vip:          "bg-purple-100 text-purple-700",
  partner:      "bg-orange-100 text-orange-700",
  collaborateur:"bg-blue-100 text-blue-700",
  admin:        "bg-red-100 text-red-700",
};

export const ADMIN_ROLES: Role[] = ["admin", "collaborateur"];
export const PRIVILEGED_ROLES: Role[] = ["admin", "collaborateur", "partner", "vip"];
