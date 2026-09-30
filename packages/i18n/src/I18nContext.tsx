import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { dictionaries } from './dictionaries';
import { I18nContextValue, SupportedLocale, TranslationKey } from './types';

const STORAGE_KEY = 'k2net_locale';
const DEFAULT_LOCALE: SupportedLocale = 'id';

export const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: SupportedLocale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = DEFAULT_LOCALE,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (stored === 'id' || stored === 'en') {
        return stored;
      }
      // Check browser navigator language
      if (navigator.language && navigator.language.startsWith('en')) {
        return 'en';
      }
    }
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const [ns, ...rest] = (key as string).split('.');
      const subPath = rest.join('.');

      // Try current locale
      const dict = dictionaries[locale]?.[ns];
      let value = dict ? (subPath ? getNestedValue(dict, subPath) : dict) : undefined;

      // Fallback to default locale (id)
      if (value === undefined && locale !== DEFAULT_LOCALE) {
        const fallbackDict = dictionaries[DEFAULT_LOCALE]?.[ns];
        value = fallbackDict ? (subPath ? getNestedValue(fallbackDict, subPath) : fallbackDict) : undefined;
      }

      if (typeof value === 'string') {
        return interpolate(value, params);
      }

      // If translation key wasn't found, return the key as fallback
      return String(key);
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      const localeTag = locale === 'id' ? 'id-ID' : 'en-US';
      return new Intl.NumberFormat(localeTag, options).format(value);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (value: number, currency: string = 'IDR'): string => {
      const localeTag = locale === 'id' ? 'id-ID' : 'en-US';
      return new Intl.NumberFormat(localeTag, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: currency === 'IDR' ? 0 : 2,
      }).format(value);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const dateObj = typeof date === 'object' ? date : new Date(date);
      const localeTag = locale === 'id' ? 'id-ID' : 'en-US';
      const defaultOptions: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options,
      };
      return new Intl.DateTimeFormat(localeTag, defaultOptions).format(dateObj);
    },
    [locale]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      formatNumber,
      formatCurrency,
      formatDate,
    }),
    [locale, setLocale, t, formatNumber, formatCurrency, formatDate]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};
