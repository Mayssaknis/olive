import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import { loadStoredLocale, persistLocale, translate, Locale } from './translations';

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  isRTL: boolean;
  t: (key: string, params?: TranslateParams) => string;
  /** Change la langue. Retourne true si un redémarrage est nécessaire (RTL). */
  setLocale: (locale: Locale) => Promise<boolean>;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLocale(): Locale {
  try {
    const code = Localization.getLocales()[0]?.languageCode;
    return code === 'ar' ? 'ar' : 'fr';
  } catch {
    return 'fr';
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadStoredLocale();
      setLocaleState(stored ?? deviceLocale());
      setReady(true);
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale): Promise<boolean> => {
    await persistLocale(next);
    setLocaleState(next);

    const shouldBeRTL = next === 'ar';
    let needsRestart = false;
    I18nManager.allowRTL(shouldBeRTL);
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      needsRestart = true;
    }
    return needsRestart;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isRTL: locale === 'ar',
      t: (key: string, params?: TranslateParams) => translate(locale, key, params),
      setLocale,
      ready,
    }),
    [locale, setLocale, ready]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
