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

import commonEn from './locales/en/common.json';
import navEn from './locales/en/nav.json';
import billingEn from './locales/en/billing.json';
import orgsEn from './locales/en/organizations.json';
import securityEn from './locales/en/security.json';
import observabilityEn from './locales/en/observability.json';
import gisEn from './locales/en/gis.json';
import usersEn from './locales/en/users.json';
import aiEn from './locales/en/ai.json';
import authEn from './locales/en/auth.json';
import projectsEn from './locales/en/projects.json';
import inventoryEn from './locales/en/inventory.json';
import issuesEn from './locales/en/issues.json';
import tasksEn from './locales/en/tasks.json';
import gatewaysEn from './locales/en/gateways.json';
import settingsEn from './locales/en/settings.json';

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
    ai: aiId,
    auth: authId,
    projects: projectsId,
    inventory: inventoryId,
    issues: issuesId,
    tasks: tasksId,
    gateways: gatewaysId,
    settings: settingsId,
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
    ai: aiEn,
    auth: authEn,
    projects: projectsEn,
    inventory: inventoryEn,
    issues: issuesEn,
    tasks: tasksEn,
    gateways: gatewaysEn,
    settings: settingsEn,
  },
};


