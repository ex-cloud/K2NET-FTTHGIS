import { useContext } from 'react';
import { I18nContext } from './I18nContext';
import { I18nContextValue, SupportedLocale, TranslationKey } from './types';

export interface UseTranslationReturn extends I18nContextValue {
  isIndonesian: boolean;
  isEnglish: boolean;
  toggleLocale: () => void;
}

export function useTranslation(): UseTranslationReturn {
  const context = useContext(I18nContext);

  if (!context) {
    // Fallback safe dummy object if used outside Provider
    return {
      locale: 'id',
      setLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => String(key),
      formatNumber: (val: number) => String(val),
      formatCurrency: (val: number) => `Rp ${val.toLocaleString('id-ID')}`,
      formatDate: (date: Date | string | number) => new Date(date).toLocaleDateString('id-ID'),
      isIndonesian: true,
      isEnglish: false,
      toggleLocale: () => {},
    };
  }

  const isIndonesian = context.locale === 'id';
  const isEnglish = context.locale === 'en';

  const toggleLocale = () => {
    context.setLocale(isIndonesian ? 'en' : 'id');
  };

  return {
    ...context,
    isIndonesian,
    isEnglish,
    toggleLocale,
  };
}
