import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'olivepress.cache:';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function keyFor(url: string, params?: unknown): string {
  return PREFIX + url + '|' + JSON.stringify(params ?? {});
}

export async function getCached<T>(url: string, params?: unknown): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(url, params));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > MAX_AGE_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(url: string, params: unknown, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(url, params), JSON.stringify({ data, ts: Date.now() } as CacheEntry<T>));
  } catch {
    // quota atteint ou stockage indisponible : le cache est un confort, jamais bloquant
  }
}
