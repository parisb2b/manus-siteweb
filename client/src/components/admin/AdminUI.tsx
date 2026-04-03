// ============================================
// DESIGN SYSTEM 97import Admin
// Couleurs, composants, styles partagés
// ============================================

// ── COULEURS ──────────────────────────────
export const ADMIN_COLORS = {
  // Fonds de page
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',

  // Navy principal
  navy: '#1E3A5F',
  navyLight: '#EFF6FF',
  navyBorder: '#BFDBFE',
  navyAccent: '#4A90D9',

  // Vert (encaissé, succès, envoyé)
  greenBg: '#F0FDF4',
  greenBorder: '#86EFAC',
  greenText: '#166534',
  greenBtn: '#16A34A',

  // Orange/Ambre (en attente, solde)
  orangeBg: '#FFFBEB',
  orangeBorder: '#FCD34D',
  orangeText: '#92400E',
  orangeBtn: '#EA580C',

  // Violet (partenaires, VIP, commission)
  purpleBg: '#FAF5FF',
  purpleBgDark: '#EDE9FE',
  purpleBorder: '#D8B4FE',
  purpleText: '#6B21A8',
  purpleBtn: '#7C3AED',

  // Bleu info
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  infoText: '#1E3A5F',
  infoBtn: '#2563EB',

  // Gris neutre
  grayBg: '#F9FAFB',
  grayBorder: '#E5E7EB',
  grayText: '#6B7280',
  grayTextDark: '#374151',

  // Rouge (refusé, erreur)
  redBg: '#FEF2F2',
  redBorder: '#FECACA',
  redText: '#991B1B',
  redBtn: '#DC2626',

  // Police
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
}

// ── TYPOGRAPHIE ───────────────────────────
export const ADMIN_TEXT = {
  sectionLabel: {
    fontSize: '10px',
    color: ADMIN_COLORS.grayText,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 8px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: ADMIN_COLORS.navy,
  },
  bodySmall: {
    fontSize: '11px',
    color: ADMIN_COLORS.grayTextDark,
  },
  label: {
    fontSize: '10px',
    color: ADMIN_COLORS.grayText,
  },
}

// ── BADGE STATUT ──────────────────────────
interface BadgeProps {
  statut: string
}
export const BadgeStatut = ({ statut }: BadgeProps) => {
  const config: Record<string, {bg: string, color: string, label: string}> = {
    nouveau:      { bg: '#2563EB', color: '#fff', label: 'Nouveau' },
    en_cours:     { bg: '#EA580C', color: '#fff', label: 'En cours' },
    negociation:  { bg: '#7C3AED', color: '#fff', label: 'Négociation' },
    accepte:      { bg: '#16A34A', color: '#fff', label: 'Accepté' },
    refuse:       { bg: '#DC2626', color: '#fff', label: 'Refusé' },
    non_conforme: { bg: '#991B1B', color: '#fff', label: 'Non conforme' },
    vip:          { bg: '#7C3AED', color: '#fff', label: 'VIP' },
    facture:      { bg: '#16A34A', color: '#fff', label: 'Facturé' },
  }
  const c = config[statut] || config.nouveau
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: '10px', padding: '2px 10px',
      borderRadius: '12px', fontWeight: 500,
    }}>
      {c.label}
    </span>
  )
}

// ── BOUTON ADMIN ──────────────────────────
interface AdminButtonProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary'|'success'|'warning'|'danger'|'purple'|'ghost'
  size?: 'sm'|'md'
  disabled?: boolean
  fullWidth?: boolean
}
export const AdminButton = ({
  onClick, children, variant = 'primary',
  size = 'sm', disabled, fullWidth
}: AdminButtonProps) => {
  const variants = {
    primary: { bg: ADMIN_COLORS.navy,     color: '#fff', border: 'none' },
    success: { bg: ADMIN_COLORS.greenBtn, color: '#fff', border: 'none' },
    warning: { bg: ADMIN_COLORS.orangeBtn,color: '#fff', border: 'none' },
    danger:  { bg: ADMIN_COLORS.redBtn,   color: '#fff', border: 'none' },
    purple:  { bg: ADMIN_COLORS.purpleBtn,color: '#fff', border: 'none' },
    ghost:   { bg: 'transparent', color: ADMIN_COLORS.grayText,
               border: `0.5px solid ${ADMIN_COLORS.grayBorder}` },
  }
  const sizes = {
    sm: { padding: '4px 10px', fontSize: '10px' },
    md: { padding: '8px 16px', fontSize: '12px' },
  }
  const v = variants[variant]
  const s = sizes[size]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? ADMIN_COLORS.grayBg : v.bg,
        color: disabled ? ADMIN_COLORS.grayText : v.color,
        border: v.border,
        borderRadius: '4px',
        padding: s.padding,
        fontSize: s.fontSize,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── SECTION LABEL ─────────────────────────
export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={ADMIN_TEXT.sectionLabel}>{children}</p>
)

// ── CARD ──────────────────────────────────
interface AdminCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}
export const AdminCard = ({ children, style }: AdminCardProps) => (
  <div style={{
    background: ADMIN_COLORS.cardBg,
    border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
    borderRadius: '8px',
    overflow: 'hidden',
    ...style,
  }}>
    {children}
  </div>
)

// ── CARD HEADER ───────────────────────────
interface AdminCardHeaderProps {
  children: React.ReactNode
  dark?: boolean
}
export const AdminCardHeader = ({
  children, dark
}: AdminCardHeaderProps) => (
  <div style={{
    background: dark ? '#111827' : ADMIN_COLORS.navy,
    padding: '10px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    {children}
  </div>
)

// ── LIGNE DE DOCUMENT (3 boutons) ─────────
interface DocumentRowProps {
  label: string
  sousTitre?: string
  couleurFond: string
  couleurBordure: string
  couleurTexte: string
  couleurBouton: string
  envoye?: boolean
  onGenerer: () => void
  onEnvoyer: () => void
  onPdf: () => void
  children?: React.ReactNode
}
export const DocumentRow = ({
  label, sousTitre, couleurFond, couleurBordure,
  couleurTexte, couleurBouton, envoye,
  onGenerer, onEnvoyer, onPdf, children
}: DocumentRowProps) => (
  <div style={{
    border: `0.5px solid ${couleurBordure}`,
    borderRadius: '8px',
    padding: '8px 12px',
    background: couleurFond,
    marginBottom: '6px',
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: couleurTexte,
        }}>
          {label}
        </span>
        {sousTitre && (
          <span style={{
            fontSize: '9px', color: couleurTexte,
            display: 'block', opacity: 0.8, marginTop: '2px',
          }}>
            {sousTitre}
          </span>
        )}
        {children}
      </div>
      <div style={{
        display: 'flex', gap: '4px',
        flexShrink: 0, marginLeft: '10px',
      }}>
        <button onClick={onGenerer} style={{
          background: couleurBouton, color: '#fff',
          border: 'none', borderRadius: '4px',
          padding: '3px 8px', fontSize: '9px',
          cursor: 'pointer', fontWeight: 500,
        }}>
          Générer
        </button>
        <button onClick={onEnvoyer} style={{
          background: envoye ? ADMIN_COLORS.greenBtn : couleurBouton,
          color: '#fff', border: 'none',
          borderRadius: '4px', padding: '3px 8px',
          fontSize: '9px', cursor: 'pointer',
        }}>
          {envoye ? 'Envoyé ✓' : '→ Envoyer'}
        </button>
        <button onClick={onPdf} style={{
          background: 'transparent',
          color: couleurTexte,
          border: `0.5px solid ${couleurBordure}`,
          borderRadius: '4px', padding: '3px 8px',
          fontSize: '9px', cursor: 'pointer',
        }}>
          PDF
        </button>
      </div>
    </div>
  </div>
)

// ── LIGNE DE PAIEMENT ─────────────────────
interface PaiementRowProps {
  numero: number
  montant: number
  type: string
  statut: 'en_attente' | 'encaisse'
  date?: string
  onEncaisser?: () => void
  onEnvoyer?: () => void
  onPdf?: () => void
}
export const PaiementRow = ({
  numero, montant, type, statut,
  date, onEncaisser, onEnvoyer, onPdf
}: PaiementRowProps) => {
  const isEnAttente = statut === 'en_attente'
  return (
    <div style={{
      border: `0.5px solid ${isEnAttente
        ? ADMIN_COLORS.orangeBorder
        : ADMIN_COLORS.greenBorder}`,
      borderRadius: '8px',
      padding: '8px 12px',
      background: isEnAttente
        ? ADMIN_COLORS.orangeBg
        : ADMIN_COLORS.greenBg,
      marginBottom: '6px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '6px',
      }}>
        <span style={{
          color: isEnAttente
            ? ADMIN_COLORS.orangeText
            : ADMIN_COLORS.greenText,
          fontWeight: 600, fontSize: '11px',
        }}>
          Acompte {numero} — {montant.toLocaleString('fr-FR')}€
          {' — '} Compte {type}
          {date && ` — ${date}`}
        </span>
        <span style={{
          background: isEnAttente ? '#F59E0B' : ADMIN_COLORS.greenBtn,
          color: '#fff', fontSize: '9px',
          padding: '1px 8px', borderRadius: '10px',
        }}>
          {isEnAttente ? 'En attente' : 'Encaissé'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {isEnAttente ? (
          <>
            <button onClick={onEncaisser} style={{
              background: ADMIN_COLORS.orangeBtn,
              color: '#fff', border: 'none',
              borderRadius: '4px', padding: '4px 10px',
              fontSize: '10px', cursor: 'pointer',
              fontWeight: 500,
            }}>
              Encaisser
            </button>
            <button onClick={onPdf} style={{
              background: 'transparent',
              color: ADMIN_COLORS.orangeText,
              border: `0.5px solid ${ADMIN_COLORS.orangeBorder}`,
              borderRadius: '4px', padding: '4px 10px',
              fontSize: '10px', cursor: 'pointer',
            }}>
              Aperçu
            </button>
          </>
        ) : (
          <>
            <button onClick={onEnvoyer} style={{
              background: ADMIN_COLORS.greenBtn,
              color: '#fff', border: 'none',
              borderRadius: '4px', padding: '4px 10px',
              fontSize: '10px', cursor: 'pointer',
            }}>
              Envoyer client
            </button>
            <button onClick={onPdf} style={{
              background: 'transparent',
              color: ADMIN_COLORS.greenText,
              border: `0.5px solid ${ADMIN_COLORS.greenBorder}`,
              borderRadius: '4px', padding: '4px 10px',
              fontSize: '10px', cursor: 'pointer',
            }}>
              PDF
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── RÉSUMÉ PAIEMENTS ──────────────────────
interface PaiementResumeProps {
  totalEncaisse: number
  soldeRestant: number
}
export const PaiementResume = ({
  totalEncaisse, soldeRestant
}: PaiementResumeProps) => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    gap: '4px', marginTop: '6px',
  }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '4px 10px', background: ADMIN_COLORS.greenBg,
      borderRadius: '4px', fontSize: '11px',
    }}>
      <span style={{ color: ADMIN_COLORS.greenText }}>
        Total encaissé
      </span>
      <span style={{
        color: ADMIN_COLORS.greenText, fontWeight: 600,
      }}>
        {totalEncaisse.toLocaleString('fr-FR')}€
      </span>
    </div>
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '4px 10px', background: '#FEF9C3',
      borderRadius: '4px', fontSize: '11px',
    }}>
      <span style={{ color: '#854D0E' }}>Solde restant</span>
      <span style={{ color: '#854D0E', fontWeight: 600 }}>
        {soldeRestant.toLocaleString('fr-FR')}€
      </span>
    </div>
  </div>
)

// ── INPUT ADMIN ───────────────────────────
interface AdminInputProps {
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  label?: string
  width?: string
}
export const AdminInput = ({
  value, onChange, placeholder,
  type = 'text', label, width = '100%'
}: AdminInputProps) => (
  <div style={{ width }}>
    {label && (
      <label style={{
        fontSize: '10px', color: ADMIN_COLORS.grayText,
        display: 'block', marginBottom: '3px',
      }}>
        {label}
      </label>
    )}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        fontSize: '11px',
        padding: '5px 8px',
        border: `0.5px solid ${ADMIN_COLORS.navyBorder}`,
        borderRadius: '4px',
        outline: 'none',
        background: '#fff',
        color: ADMIN_COLORS.navy,
        boxSizing: 'border-box' as const,
      }}
    />
  </div>
)

// ── SELECT ADMIN ──────────────────────────
interface AdminSelectProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label?: string
}
export const AdminSelect = ({
  value, onChange, options, label
}: AdminSelectProps) => (
  <div>
    {label && (
      <label style={{
        fontSize: '10px', color: ADMIN_COLORS.grayText,
        display: 'block', marginBottom: '3px',
      }}>
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: '11px',
        padding: '5px 8px',
        border: `0.5px solid ${ADMIN_COLORS.navyBorder}`,
        borderRadius: '4px',
        background: '#fff',
        color: ADMIN_COLORS.navy,
        width: '100%',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
)
