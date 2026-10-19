import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getCached, setCached } from './offlineCache';

/**
 * URL de base de l'API, par ordre de priorite :
 *  1. EXPO_PUBLIC_API_URL (build EAS / production)
 *  2. app.json -> expo.extra.apiBaseUrl (dev local sur le reseau)
 *  3. localhost (simulateur)
 * Rappels reseau :
 *  - Emulateur Android : http://10.0.2.2:8091/api
 *  - Simulateur iOS / web : http://localhost:8091/api
 *  - Appareil physique : http://<IP-du-PC>:8091/api
 *  - Production : https://<service>.onrender.com/api
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ??
  'http://localhost:8091/api';

const TOKEN_KEY = 'olivepress.token';
const REFRESH_KEY = 'olivepress.refresh';

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  inMemoryToken = stored;
  return stored;
}

export async function loadRefreshToken(): Promise<string | null> {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  const stored = await AsyncStorage.getItem(REFRESH_KEY);
  inMemoryRefreshToken = stored;
  return stored;
}

export async function saveTokens(token: string, refreshToken: string): Promise<void> {
  inMemoryToken = token;
  inMemoryRefreshToken = refreshToken;
  await AsyncStorage.multiSet([[TOKEN_KEY, token], [REFRESH_KEY, refreshToken]]);
}

export async function clearToken(): Promise<void> {
  inMemoryToken = null;
  inMemoryRefreshToken = null;
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
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

const isCacheableGet = (config?: any): boolean =>
  !!config && String(config.method ?? 'get').toLowerCase() === 'get' && !String(config.url ?? '').includes('/auth/');

/** Rafraichissement mutualise : une seule requete /auth/refresh pour tous les 401 simultanes. */
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
  (response) => {
    if (isCacheableGet(response.config)) {
      void setCached(response.config.url as string, response.config.params, response.data);
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const original = error.config as any;
    const url: string = original?.url ?? '';

    // Serveur injoignable (hors-ligne) : on ressert la derniere donnee connue.
    if (!error.response && isCacheableGet(original)) {
      const cached = await getCached(url, original?.params);
      if (cached !== null) {
        return {
          data: cached,
          status: 200,
          statusText: 'OK (cache)',
          headers: { 'x-from-cache': 'true' },
          config: original,
          request: {},
        } as any;
      }
    }

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
  }
);

/** Extrait un message d'erreur lisible depuis une reponse Axios. */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.message) {
      const fields = data.fields ? Object.values(data.fields).join(', ') : '';
      return fields ? `${data.message} : ${fields}` : data.message;
    }
    if (error.code === 'ECONNABORTED') return 'Delai depasse. Verifiez la connexion au serveur.';
    if (!error.response) return 'Serveur injoignable. Verifiez que le backend est lance.';
    return `Erreur ${error.response.status}`;
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue';
}
