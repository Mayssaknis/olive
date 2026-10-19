export const ALL_PERMISSIONS = [
  { value: 'DASHBOARD_READ', label: 'Tableau de bord' },
  { value: 'CLIENT_READ', label: 'Clients — lecture' },
  { value: 'CLIENT_WRITE', label: 'Clients — création/modification' },
  { value: 'APPORT_READ', label: 'Apports — lecture' },
  { value: 'APPORT_WRITE', label: 'Apports — saisie' },
  { value: 'PRODUCTION_READ', label: 'Production — lecture' },
  { value: 'PRODUCTION_WRITE', label: 'Production — saisie/étapes' },
  { value: 'STOCK_READ', label: 'Stock — lecture' },
  { value: 'STOCK_WRITE', label: 'Stock — mouvements' },
  { value: 'LIVRAISON_READ', label: 'Livraisons — lecture' },
  { value: 'LIVRAISON_WRITE', label: 'Livraisons — saisie' },
  { value: 'FACTURE_READ', label: 'Factures — lecture' },
  { value: 'FACTURE_WRITE', label: 'Factures — création/paiements' },
  { value: 'EMPLOYEE_READ', label: 'Employés — lecture' },
  { value: 'EMPLOYEE_WRITE', label: 'Employés — gestion' },
  { value: 'NOTIFICATION_READ', label: 'Notifications' },
  { value: 'HISTORY_READ', label: 'Historique' },
  { value: 'REPORT_READ', label: 'Rapports' },
] as const;

export type PermissionValue = (typeof ALL_PERMISSIONS)[number]['value'];
