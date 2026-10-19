export type Role = 'ADMIN' | 'EMPLOYEE';

export type Permission =
  | 'DASHBOARD_READ'
  | 'CLIENT_READ'
  | 'CLIENT_WRITE'
  | 'APPORT_READ'
  | 'APPORT_WRITE'
  | 'PRODUCTION_READ'
  | 'PRODUCTION_WRITE'
  | 'STOCK_READ'
  | 'STOCK_WRITE'
  | 'LIVRAISON_READ'
  | 'LIVRAISON_WRITE'
  | 'FACTURE_READ'
  | 'FACTURE_WRITE'
  | 'EMPLOYEE_READ'
  | 'EMPLOYEE_WRITE'
  | 'NOTIFICATION_READ'
  | 'HISTORY_READ'
  | 'REPORT_READ'
  | 'SETTING_WRITE';

export type ApportStatus =
  | 'RECU'
  | 'EN_ATTENTE'
  | 'TRI'
  | 'PRESSAGE'
  | 'PRODUCTION_TERMINEE'
  | 'STOCKAGE'
  | 'LIVRAISON'
  | 'CLOTURE'
  | 'ANOMALIE';

export type FactureStatut = 'IMPAYEE' | 'PARTIELLE' | 'PAYEE';
export type MovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT_POSITIF' | 'AJUSTEMENT_NEGATIF';
export type PaymentMode = 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'CARTE' | 'AUTRE';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  permissions: Permission[];
  active: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Client {
  id: number;
  code?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

export interface Apport {
  id: number;
  numero: string;
  clientId: number;
  clientName: string;
  clientCode?: string;
  receivedAt: string;
  grossWeightKg: number;
  tareKg: number;
  netWeightKg: number;
  ticketNumber?: string;
  observations?: string;
  employeeName?: string;
  status: ApportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  id: number;
  fromStatus?: ApportStatus;
  toStatus: ApportStatus;
  userName?: string;
  changedAt: string;
  comment?: string;
}

export interface ProductionRecord {
  id: number;
  apportId: number;
  apportNumero: string;
  clientName: string;
  olivesProcessedKg: number;
  oilObtainedL: number;
  yieldPercent: number;
  productionDate: string;
  employeeName?: string;
  notes?: string;
  createdAt: string;
}

export interface StockSummary {
  availableL: number;
  totalInL: number;
  totalOutL: number;
}

export interface StockMovement {
  id: number;
  movementType: MovementType;
  quantityL: number;
  signedQuantity: number;
  lotNumber?: string;
  clientId?: number;
  clientName?: string;
  reason?: string;
  userName?: string;
  createdAt: string;
}

export interface Livraison {
  id: number;
  numero: string;
  clientId: number;
  clientName: string;
  clientCode?: string;
  quantityL: number;
  lotNumber?: string;
  deliveredAt: string;
  employeeName?: string;
  observations?: string;
}

export interface InvoiceLine {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Facture {
  id: number;
  numero: string;
  clientId: number;
  clientName: string;
  clientCode?: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  statut: FactureStatut;
  notes?: string;
  lines: InvoiceLine[];
  createdAt: string;
  apportId?: number;
}

export interface Paiement {
  id: number;
  factureId: number;
  factureNumero: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  paidAt: string;
  employeeName?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  readFlag: boolean;
  entityType?: string;
  entityId?: number;
  createdAt: string;
}

export interface HistoryEntry {
  id: number;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: string;
  createdAt: string;
}

export interface Dashboard {
  apportsToday: number;
  netWeightTodayKg: number;
  olivesProcessedTotalKg: number;
  oilProducedTotalL: number;
  avgYieldPercent: number;
  pendingOperations: number;
  availableStockL: number;
  totalInvoiced: number;
  totalCollected: number;
  totalRemaining: number;
  productionByDay: { date: string; olivesKg: number; oilL: number }[];
  yieldByDay: { date: string; yieldPercent: number }[];
  recentApports: {
    id: number;
    numero: string;
    clientName: string;
    netWeightKg: number;
    receivedAt: string;
    status: string;
  }[];
  pendingList: {
    apportId: number;
    numero: string;
    clientName: string;
    netWeightKg: number;
    status: string;
  }[];
  unpaidInvoices: {
    id: number;
    numero: string;
    clientName: string;
    totalAmount: number;
    remainingAmount: number;
    statut: string;
    invoiceDate: string;
  }[];
}

export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
