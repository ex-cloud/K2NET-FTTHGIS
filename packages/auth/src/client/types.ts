import type Keycloak from "keycloak-js";
import type { KeycloakLoginOptions, KeycloakLogoutOptions } from "keycloak-js";

export type { KeycloakLoginOptions, KeycloakLogoutOptions };

export interface KeycloakUser {
  id: string;
  email?: string;
  username: string;
  name?: string;
  roles: string[];
  tenantId?: string;
  tenantSlug?: string;
  avatarUrl?: string;
  organizationId?: string;
  organizationSlug?: string;
  permissions?: string[];
  issuer?: string;
}

export interface KeycloakAuthConfig {
  url: string;
  realm: string;
  clientId: string;
  onTokens?: (tokens: { token?: string; refreshToken?: string; idToken?: string }) => void;
  onAuthSuccess?: (user: KeycloakUser) => void;
  onAuthError?: (error: unknown) => void;
}

export interface KeycloakAuthContextValue {
  keycloak: Keycloak | null;
  initialized: boolean;
  authenticated: boolean;
  token: string | null;
  user: KeycloakUser | null;
  roles: string[];
  login: (options?: KeycloakLoginOptions) => Promise<void>;
  logout: (options?: KeycloakLogoutOptions) => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  refreshToken: (minValidity?: number) => Promise<boolean>;
}
