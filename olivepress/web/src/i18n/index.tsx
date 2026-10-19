import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { loadStoredLocale, persistLocale, translate, Locale } from './translations';

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
  t: (key: string, params?: TranslateParams) => string;
  setLocale: (locale: Locale) => Promise<void>;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLocale(): Locale {
  try {
    return (navigator.language || 'fr').toLowerCase().startsWith('ar') ? 'ar' : 'fr';
  } catch {
    return 'fr';
  }
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadStoredLocale();
      const next = stored ?? deviceLocale();
      setLocaleState(next);
      applyDocumentLocale(next);
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale): Promise<void> => {
    await persistLocale(next);
    setLocaleState(next);
    applyDocumentLocale(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: locale === 'ar',
      t: (key: string, params?: TranslateParams) => translate(locale, key, params),
      setLocale,
      ready,
    }),
    [locale, setLocale, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
