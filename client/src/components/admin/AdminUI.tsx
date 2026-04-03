/**
 * AdminUI — composants de base réutilisables (héritage)
 * Conservé pour compatibilité avec AdminParametres, AdminSuiviAchats, AdminMedia
 */

export const ADMIN_COLORS = {
  navy: "#1E3A5F",
  navyLight: "#2A4A6F",
  navyBorder: "#D1D5DB",
  accent: "#4A90D9",
  accentHover: "#357ABD",
  grayTextDark: "#374151",
  grayTextLight: "#6B7280",
  grayBg: "#F5F5F5",
  white: "#FFFFFF",
  red: "#EF4444",
  green: "#10B981",
  orange: "#F59E0B",
};

export function AdminCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: ADMIN_COLORS.white,
        borderRadius: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function AdminButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const bgColor =
    variant === "danger"
      ? ADMIN_COLORS.red
      : variant === "secondary"
        ? ADMIN_COLORS.white
        : ADMIN_COLORS.accent;

  const textColor = variant === "secondary" ? ADMIN_COLORS.grayTextDark : ADMIN_COLORS.white;
  const border = variant === "secondary" ? `1px solid ${ADMIN_COLORS.navyBorder}` : "none";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "10px",
        border,
        background: bgColor,
        color: textColor,
        fontSize: "13px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
