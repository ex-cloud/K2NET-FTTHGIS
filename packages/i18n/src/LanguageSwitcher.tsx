import React from 'react';
import { useTranslation } from './useTranslation';
import { SupportedLocale } from './types';

export interface LanguageSwitcherProps {
  variant?: 'pill' | 'select' | 'compact';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { locale, setLocale, toggleLocale } = useTranslation();

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center rounded-lg border border-border bg-card p-0.5 text-xs font-medium shadow-xs ${className}`}
        role="group"
        aria-label="Language selector"
      >
        <button
          type="button"
          onClick={() => setLocale('id')}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
            locale === 'id'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>🇮🇩</span>
          <span>ID</span>
        </button>
        <button
          type="button"
          onClick={() => setLocale('en')}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
            locale === 'en'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    );
  }

  if (variant === 'select') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as SupportedLocale)}
          aria-label="Select language"
          className="h-9 appearance-none rounded-md border border-input bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-foreground shadow-xs transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="id">Bahasa Indonesia (ID)</option>
          <option value="en">English (EN)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-95 ${className}`}
      title={locale === 'id' ? 'Ganti ke English' : 'Switch to Indonesian'}
    >
      <span className="text-sm">{locale === 'id' ? '🇮🇩' : '🇬🇧'}</span>
      <span className="font-semibold uppercase tracking-wider">{locale}</span>
    </button>
  );
};
