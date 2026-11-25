import type Keycloak from "keycloak-js";
import type { KeycloakLoginOptions, KeycloakLogoutOptions } from "keycloak-js";

export type { KeycloakLoginOptions, KeycloakLogoutOptions };

export interface AuthLoginOptions extends KeycloakLoginOptions {
  extraParams?: Record<string, string>;
}

export type AuthPlane = "PLATFORM" | "TENANT";

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

export interface CredentialLoginInput {
  plane?: AuthPlane;
  tenantSlug?: string;
  username: string;
  password: string;
  totp?: string;
  rememberMe?: boolean;
  turnstileToken?: string;
  isBreakGlass?: boolean;
}

export interface CredentialLoginResult {
  success: boolean;
  mfaRequired?: boolean;
  preAuthToken?: string;
  availableMethods?: string[];
  maskedEmail?: string;
  error?: string;
  message?: string;
  user?: KeycloakUser;
}

export interface DiscoverableWebauthnChallengeInput {
  plane?: AuthPlane;
  tenantSlug?: string;
  username?: string;
  conditional?: boolean;
}

export interface DiscoverableWebauthnChallengeResponse {
  challengeId: string;
  challenge: string;
  rpId: string;
  allowCredentials?: Array<{ type: string; id: string }>;
  timeout?: number;
  userVerification?: string;
}

export interface DiscoverableWebauthnVerifyInput {
  challengeId: string;
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
  plane?: AuthPlane;
  tenantSlug?: string;
  rememberMe?: boolean;
  isBreakGlass?: boolean;
}

export interface KeycloakAuthConfig {
  url: string;
  realm: string;
  clientId: string;
  plane?: AuthPlane;
  tenantSlug?: string;
  loginPath?: string;
  onTokens?: (tokens: { token?: string; refreshToken?: string; idToken?: string }) => void;
  onAuthSuccess?: (user: KeycloakUser) => void;
  onAuthError?: (error: unknown) => void;
}

export interface KeycloakAuthContextValue {
  keycloak: Keycloak | null;
  initialized: boolean;
  authenticated: boolean;
  sessionTerminated: boolean;
  sessionTerminationCode?: string | null;
  isBreakGlassSession?: boolean;
  sessionMaxAge?: number;
  loginPath: string;
  token: string | null;
  user: KeycloakUser | null;
  roles: string[];
  login: (options?: AuthLoginOptions) => Promise<void>;
  loginWithCredentials: (input: CredentialLoginInput) => Promise<CredentialLoginResult>;
  logout: (options?: KeycloakLogoutOptions) => Promise<void>;
  clearSessionTerminated: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isSuperAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  refreshToken: (minValidity?: number) => Promise<boolean>;
  verifyMfaTotp?: (preAuthToken: string, code: string) => Promise<CredentialLoginResult>;
  sendMfaEmailOtp?: (preAuthToken: string) => Promise<{ success: boolean; message?: string; maskedEmail?: string }>;
  verifyMfaEmailOtp?: (preAuthToken: string, code: string) => Promise<CredentialLoginResult>;
  getWebauthnLoginChallenge?: (preAuthToken: string) => Promise<{ challenge: string; rpId: string; allowCredentials?: Array<{ type: string; id: string }> }>;
  verifyWebauthnLogin?: (preAuthToken: string, payload: { credentialId: string; clientDataJSON: string; authenticatorData: string; signature: string }) => Promise<CredentialLoginResult>;
  getPasskeyPasswordlessChallenge?: (input?: DiscoverableWebauthnChallengeInput) => Promise<DiscoverableWebauthnChallengeResponse>;
  verifyPasskeyPasswordlessLogin?: (input: DiscoverableWebauthnVerifyInput) => Promise<CredentialLoginResult>;
  verifyMfaBackupCode?: (preAuthToken: string, code: string) => Promise<CredentialLoginResult>;
}
