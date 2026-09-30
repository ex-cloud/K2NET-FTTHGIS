import commonId from './locales/id/common.json';
import navId from './locales/id/nav.json';
import billingId from './locales/id/billing.json';
import orgsId from './locales/id/organizations.json';
import securityId from './locales/id/security.json';
import observabilityId from './locales/id/observability.json';
import gisId from './locales/id/gis.json';
import usersId from './locales/id/users.json';

import commonEn from './locales/en/common.json';
import navEn from './locales/en/nav.json';
import billingEn from './locales/en/billing.json';
import orgsEn from './locales/en/organizations.json';
import securityEn from './locales/en/security.json';
import observabilityEn from './locales/en/observability.json';
import gisEn from './locales/en/gis.json';
import usersEn from './locales/en/users.json';

import { SupportedLocale } from './types';

export const dictionaries: Record<SupportedLocale, Record<string, Record<string, any>>> = {
  id: {
    common: commonId,
    nav: navId,
    billing: billingId,
    organizations: orgsId,
    security: securityId,
    observability: observabilityId,
    gis: gisId,
    users: usersId,
  },
  en: {
    common: commonEn,
    nav: navEn,
    billing: billingEn,
    organizations: orgsEn,
    security: securityEn,
    observability: observabilityEn,
    gis: gisEn,
    users: usersEn,
  },
};

