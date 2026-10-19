import axios, { AxiosError } from 'axios';

/**
 * URL de base de l'API, par ordre de priorite :
 *  1. VITE_API_URL (build / .env)
 *  2. proxy Vite en dev (/api -> localhost:8091)
 *  3. localhost (backend local)
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api';

const TOKEN_KEY = 'olivepress.token';
const REFRESH_KEY = 'olivepress.refresh';

export async function loadToken(): Promise<string | null> {
  return localStorage.getItem(TOKEN_KEY);
}

export async function loadRefreshToken(): Promise<string | null> {
  return localStorage.getItem(REFRESH_KEY);
}

export async function saveTokens(token: string, refreshToken: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export async function clearToken(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await loadToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// Rafraichissement mutualise : une seule requete /auth/refresh pour tous les 401 simultanes.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then(async (r) => {
        await saveTokens(r.data.token, r.data.refreshToken);
        return r.data.token as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const original = error.config as any;
    const url: string = original?.url ?? '';
    const canRetry =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh');

    if (canRetry) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }

    if (error.response?.status === 401) {
      await clearToken();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/** Extrait un message d'erreur lisible depuis une reponse Axios. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.message) {
      const fields = data.fields ? Object.values(data.fields).join(', ') : '';
      return fields ? `${data.message} : ${fields}` : data.message;
    }
    if (error.code === 'ECONNABORTED') return 'Délai dépassé. Vérifiez la connexion au serveur.';
    if (!error.response) return 'Serveur injoignable. Vérifiez que le backend est lancé.';
    return `Erreur ${error.response.status}`;
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue';
}
