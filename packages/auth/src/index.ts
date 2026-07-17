/**
 * @k2net/auth — Public API
 *
 * Re-exports everything needed by studio-admin and studio-tenant portals.
 */

// Type augmentations (must be imported in each app's auth.ts)
export type {} from "./types";

// Utilities
export {
  logInfo,
  getCookieDomain,
  generateGravatar,
  refreshAccessToken,
  getRealmFromHost,
} from "./utils";

// Auth config factory and instances
export {
  baseAuthConfig,
  getDynamicAuthConfig,
  createAuth,
} from "./auth-config";
