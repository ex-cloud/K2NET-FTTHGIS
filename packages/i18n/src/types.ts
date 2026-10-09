import commonId from './locales/id/common.json';
import navId from './locales/id/nav.json';
import billingId from './locales/id/billing.json';
import orgsId from './locales/id/organizations.json';
import securityId from './locales/id/security.json';
import observabilityId from './locales/id/observability.json';
import gisId from './locales/id/gis.json';
import usersId from './locales/id/users.json';
import aiId from './locales/id/ai.json';
import authId from './locales/id/auth.json';
import projectsId from './locales/id/projects.json';
import inventoryId from './locales/id/inventory.json';
import issuesId from './locales/id/issues.json';
import tasksId from './locales/id/tasks.json';
import gatewaysId from './locales/id/gateways.json';
import settingsId from './locales/id/settings.json';
import licenseId from './locales/id/license.json';

export type SupportedLocale = 'id' | 'en';

export interface TranslationsSchema {
  common: typeof commonId;
  nav: typeof navId;
  billing: typeof billingId;
  organizations: typeof orgsId;
  security: typeof securityId;
  observability: typeof observabilityId;
  gis: typeof gisId;
  users: typeof usersId;
  ai: typeof aiId;
  auth: typeof authId;
  projects: typeof projectsId;
  inventory: typeof inventoryId;
  issues: typeof issuesId;
  tasks: typeof tasksId;
  gateways: typeof gatewaysId;
  settings: typeof settingsId;
  license: typeof licenseId;
}

export type TranslationNamespace = keyof TranslationsSchema;

// Helper to generate dot-notation paths for keys: e.g. "common.save" | "billing.title" | "billing.free_trial_remaining"
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;
type DotNestedKeys<T> = (
  T extends object
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<keyof T, symbol>]
    : ''
) extends infer D
  ? Extract<D, string>
  : never;

export type TranslationKey = {
  [N in TranslationNamespace]: `${N}.${DotNestedKeys<TranslationsSchema[N]>}`;
}[TranslationNamespace] | (string & {});

export interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}
