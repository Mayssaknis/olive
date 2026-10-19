export const colors = {
  olive: '#556B2F',
  oliveDark: '#283D2B',
  cream: '#F7F4EC',
  white: '#FFFFFF',
  softGray: '#E8E8E2',
  textPrimary: '#283D2B',
  textSecondary: '#6B6B63',
  textMuted: '#9A9A90',
  border: '#E0E0D8',
  success: '#4C7A34',
  warning: '#C48A1B',
  danger: '#B23A38',
  info: '#3B6E8F',
  overlay: 'rgba(40,61,43,0.35)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#283D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const statusColors: Record<string, { bg: string; fg: string; label: string }> = {
  RECU: { bg: '#EAEFE0', fg: '#4C7A34', label: 'Reçu' },
  EN_ATTENTE: { bg: '#F6EFD9', fg: '#9A7215', label: 'En attente' },
  TRI: { bg: '#E3ECF3', fg: '#3B6E8F', label: 'Tri' },
  PRESSAGE: { bg: '#E3ECF3', fg: '#3B6E8F', label: 'Pressage' },
  PRODUCTION_TERMINEE: { bg: '#DCEBD3', fg: '#3F6A29', label: 'Production terminée' },
  STOCKAGE: { bg: '#EAEFE0', fg: '#4C7A34', label: 'Stockage' },
  LIVRAISON: { bg: '#EDE7F6', fg: '#5E4B8B', label: 'Livraison' },
  CLOTURE: { bg: '#E8E8E2', fg: '#6B6B63', label: 'Clôturé' },
  ANOMALIE: { bg: '#F6DEDD', fg: '#B23A38', label: 'Anomalie' },
  PAYEE: { bg: '#DCEBD3', fg: '#3F6A29', label: 'Payée' },
  PARTIELLE: { bg: '#F6EFD9', fg: '#9A7215', label: 'Partielle' },
  IMPAYEE: { bg: '#F6DEDD', fg: '#B23A38', label: 'Impayée' },
};
