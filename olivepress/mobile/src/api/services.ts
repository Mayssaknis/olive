import { api } from './client';
import {
  Apport, ApportStatus, Client, Dashboard, Facture, FactureStatut,
  HistoryEntry, Livraison, LoginResponse, MovementType, Page, Paiement,
  PaymentMode, ProductionRecord, StatusHistory, StockMovement, StockSummary, User, AppNotification,
} from '../types';

// ---------- Auth ----------
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api
      .post<{ message: string }>('/auth/change-password', { currentPassword, newPassword })
      .then((r) => r.data),
};

// ---------- Notifications push ----------
export const pushApi = {
  register: (token: string, platform: string) =>
    api.post('/push/register', { token, platform }).then((r) => r.data),
  unregister: (token: string) =>
    api.post('/push/unregister', { token }).then((r) => r.data),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  get: () => api.get<Dashboard>('/dashboard').then((r) => r.data),
};

// ---------- Clients ----------
export interface ClientInput {
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  active?: boolean;
}

export const clientsApi = {
  list: (query?: string, active?: boolean) =>
    api.get<Client[]>('/clients', { params: { query, active } }).then((r) => r.data),
  page: (params: { query?: string; active?: boolean; page?: number; size?: number } = {}) =>
    api.get<Page<Client>>('/clients/page', { params: { size: 20, ...params } }).then((r) => r.data),
  get: (id: number) => api.get<Client>(`/clients/${id}`).then((r) => r.data),
  create: (data: ClientInput) => api.post<Client>('/clients', data).then((r) => r.data),
  update: (id: number, data: ClientInput) => api.put<Client>(`/clients/${id}`, data).then((r) => r.data),
};

// ---------- Apports ----------
export interface ApportInput {
  clientId: number;
  receivedAt?: string;
  grossWeightKg: number;
  tareKg?: number;
  ticketNumber?: string;
  observations?: string;
}

export interface ApportFilters {
  query?: string;
  clientId?: number;
  status?: ApportStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const apportsApi = {
  list: (filters: ApportFilters = {}) =>
    api.get<Page<Apport>>('/apports', { params: { size: 20, ...filters } }).then((r) => r.data),
  recent: () => api.get<Apport[]>('/apports/recent').then((r) => r.data),
  get: (id: number) => api.get<Apport>(`/apports/${id}`).then((r) => r.data),
  byClient: (clientId: number) => api.get<Apport[]>(`/apports/by-client/${clientId}`).then((r) => r.data),
  create: (data: ApportInput) => api.post<Apport>('/apports', data).then((r) => r.data),
  update: (id: number, data: ApportInput) => api.put<Apport>(`/apports/${id}`, data).then((r) => r.data),
  updateStatus: (id: number, status: ApportStatus, comment?: string) =>
    api.patch<Apport>(`/apports/${id}/status`, { status, comment }).then((r) => r.data),
  history: (id: number) => api.get<StatusHistory[]>(`/apports/${id}/history`).then((r) => r.data),
  ticket: (id: number) => api.get<any>(`/apports/${id}/ticket`).then((r) => r.data),
};

// ---------- Production ----------
export interface ProductionInput {
  apportId: number;
  olivesProcessedKg: number;
  oilObtainedL: number;
  productionDate: string;
  notes?: string;
}

export const productionApi = {
  byApport: (apportId: number) =>
    api.get<ProductionRecord[]>(`/production/by-apport/${apportId}`).then((r) => r.data),
  record: (data: ProductionInput) => api.post<ProductionRecord>('/production', data).then((r) => r.data),
};

// ---------- Stock ----------
export interface StockMovementInput {
  movementType: MovementType;
  quantityL: number;
  lotNumber?: string;
  clientId?: number;
  reason?: string;
}

export const stockApi = {
  summary: () => api.get<StockSummary>('/stock/summary').then((r) => r.data),
  movements: (params: { page?: number; size?: number } = {}) =>
    api.get<Page<StockMovement>>('/stock/movements', { params: { size: 20, ...params } }).then((r) => r.data),
  move: (data: StockMovementInput) => api.post<StockMovement>('/stock/movements', data).then((r) => r.data),
};

// ---------- Livraisons ----------
export interface LivraisonInput {
  clientId: number;
  quantityL: number;
  lotNumber?: string;
  deliveredAt?: string;
  observations?: string;
}

export const livraisonsApi = {
  list: (params: { clientId?: number; page?: number; size?: number } = {}) =>
    api.get<Page<Livraison>>('/livraisons', { params: { size: 20, ...params } }).then((r) => r.data),
  get: (id: number) => api.get<Livraison>(`/livraisons/${id}`).then((r) => r.data),
  create: (data: LivraisonInput) => api.post<Livraison>('/livraisons', data).then((r) => r.data),
};

// ---------- Factures & paiements ----------
export interface FactureLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface FactureInput {
  clientId: number;
  invoiceDate?: string;
  dueDate?: string;
  notes?: string;
  lines: FactureLineInput[];
}

export const facturesApi = {
  list: (params: { clientId?: number; statut?: FactureStatut; page?: number; size?: number } = {}) =>
    api.get<Page<Facture>>('/factures', { params: { size: 20, ...params } }).then((r) => r.data),
  byClient: (clientId: number) => api.get<Facture[]>(`/factures/by-client/${clientId}`).then((r) => r.data),
  byApport: (apportId: number) => api.get<Facture | null>(`/factures/by-apport/${apportId}`).then((r) => r.data),
  get: (id: number) => api.get<Facture>(`/factures/${id}`).then((r) => r.data),
  create: (data: FactureInput) => api.post<Facture>('/factures', data).then((r) => r.data),
  payments: (id: number) => api.get<Paiement[]>(`/factures/${id}/paiements`).then((r) => r.data),
  pay: (id: number, amount: number, mode: PaymentMode, reference?: string) =>
    api.post<Facture>(`/factures/${id}/paiements`, { amount, mode, reference }).then((r) => r.data),
};

// ---------- Réglages ----------
export interface TarifSettings {
  tarifParKg: number;
  updatedAt?: string;
}

export const settingsApi = {
  getTarif: () => api.get<TarifSettings>('/settings/tarif').then((r) => r.data),
  setTarif: (tarifParKg: number) =>
    api.put<TarifSettings>('/settings/tarif', { tarifParKg }).then((r) => r.data),
};

// ---------- Employes ----------
export interface EmployeeInput {
  username?: string;
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  permissions?: string[];
  active?: boolean;
}

export const employeesApi = {
  list: () => api.get<User[]>('/employes').then((r) => r.data),
  create: (data: EmployeeInput) => api.post<User>('/employes', data).then((r) => r.data),
  update: (id: number, data: EmployeeInput) => api.put<User>(`/employes/${id}`, data).then((r) => r.data),
  toggle: (id: number) => api.patch<User>(`/employes/${id}/toggle`).then((r) => r.data),
};

// ---------- Notifications ----------
export const notificationsApi = {
  list: (params: { page?: number; size?: number } = {}) =>
    api.get<Page<AppNotification>>('/notifications', { params: { size: 20, ...params } }).then((r) => r.data),
  unreadCount: () => api.get<number>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: number) => api.patch<AppNotification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

// ---------- Historique ----------
export const historyApi = {
  list: (params: { userId?: number; page?: number; size?: number } = {}) =>
    api.get<Page<HistoryEntry>>('/historique', { params: { size: 30, ...params } }).then((r) => r.data),
};

// ---------- Rapports ----------
export const reportsApi = {
  get: (type: string, from?: string, to?: string) =>
    api.get<Record<string, any>>('/rapports', { params: { type, from, to } }).then((r) => r.data),
};
