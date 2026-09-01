import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import Keycloak from "keycloak-js";
import type { KeycloakAuthConfig, KeycloakAuthContextValue, KeycloakUser } from "./types";

const KeycloakAuthContext = createContext<KeycloakAuthContextValue | null>(null);

export interface KeycloakProviderProps {
  config: KeycloakAuthConfig;
  children: React.ReactNode;
  initOptions?: Keycloak.KeycloakInitOptions;
  loadingFallback?: React.ReactNode;
}

export function KeycloakProvider({
  config,
  children,
  initOptions,
  loadingFallback,
}: KeycloakProviderProps) {
  const [keycloakInstance, setKeycloakInstance] = useState<Keycloak | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<KeycloakUser | null>(null);
  const isInitializing = useRef(false);

interface KeycloakParsedClaims {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  tenant_id?: string;
  tenant_slug?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

  // Extract roles and user info from Keycloak token parsed claims
  const extractUser = (kc: Keycloak): KeycloakUser | null => {
    if (!kc.tokenParsed) return null;
    const parsed = kc.tokenParsed as KeycloakParsedClaims;

    const realmRoles: string[] = parsed.realm_access?.roles || [];
    const clientRoles: string[] = parsed.resource_access?.[config.clientId]?.roles || [];
    const allRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

    return {
      id: parsed.sub || "",
      email: parsed.email,
      username: parsed.preferred_username || parsed.sub || "user",
      name: parsed.name || parsed.preferred_username || "User",
      roles: allRoles,
      tenantId: parsed.tenant_id,
      tenantSlug: parsed.tenant_slug,
    };
  };

  useEffect(() => {
    if (isInitializing.current || keycloakInstance) return;
    isInitializing.current = true;

    const kc = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    setKeycloakInstance(kc);

    const defaultInitOptions: Keycloak.KeycloakInitOptions = {
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      enableLogging: false,
      ...initOptions,
    };

    kc.init(defaultInitOptions)
      .then((auth) => {
        setKeycloakInstance(kc);
        setAuthenticated(Boolean(auth));
        setInitialized(true);

        if (auth && kc.token) {
          setToken(kc.token);
          const currentUser = extractUser(kc);
          setUser(currentUser);
          if (currentUser && config.onAuthSuccess) {
            config.onAuthSuccess(currentUser);
          }
          if (config.onTokens) {
            config.onTokens({
              token: kc.token,
              refreshToken: kc.refreshToken,
              idToken: kc.idToken,
            });
          }
        }
      })
      .catch((err) => {
        console.warn("[KeycloakProvider] Check-SSO unauthenticated:", err);
        setKeycloakInstance(kc);
        setAuthenticated(false);
        setInitialized(true);
        if (config.onAuthError) {
          config.onAuthError(err);
        }
      });

    // Auto token refresh listener
    kc.onTokenExpired = () => {
      kc.updateToken(30)
        .then((refreshed) => {
          if (refreshed && kc.token) {
            setToken(kc.token);
            setUser(extractUser(kc));
            if (config.onTokens) {
              config.onTokens({
                token: kc.token,
                refreshToken: kc.refreshToken,
                idToken: kc.idToken,
              });
            }
          }
        })
        .catch(() => {
          console.warn("[KeycloakProvider] Failed to refresh token, logging out");
          setAuthenticated(false);
          setToken(null);
          setUser(null);
        });
    };
  }, [config, initOptions]);

  const roles = useMemo(() => user?.roles || [], [user]);

  const hasRole = (role: string): boolean => {
    // God mode / Super Admin bypass
    if (roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN")) {
      return true;
    }
    return roles.includes(role);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    if (roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN")) {
      return true;
    }
    return roleList.some((r) => roles.includes(r));
  };

  const isSuperAdmin = (): boolean => {
    return roles.includes("super_admin") || roles.includes("ROLE_SUPER_ADMIN");
  };

  const isTenantAdmin = (): boolean => {
    return isSuperAdmin() || roles.includes("tenant_admin") || roles.includes("isp_admin");
  };

  const login = async (options?: Keycloak.KeycloakLoginOptions) => {
    if (keycloakInstance) {
      try {
        await keycloakInstance.login(options);
      } catch (e) {
        console.error("[KeycloakProvider] login() failed, falling back to direct redirect:", e);
        const redirect = options?.redirectUri || window.location.href;
        window.location.href = `${config.url}/realms/${config.realm}/protocol/openid-connect/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=openid`;
      }
    } else {
      window.location.href = "/login";
    }
  };

  const logout = async (options?: Keycloak.KeycloakLogoutOptions) => {
    if (keycloakInstance) {
      await keycloakInstance.logout({
        redirectUri: window.location.origin,
        ...options,
      });
      setAuthenticated(false);
      setToken(null);
      setUser(null);
    }
  };

  const refreshToken = async (minValidity: number = 30): Promise<boolean> => {
    if (!keycloakInstance) return false;
    try {
      const refreshed = await keycloakInstance.updateToken(minValidity);
      if (refreshed && keycloakInstance.token) {
        setToken(keycloakInstance.token);
        setUser(extractUser(keycloakInstance));
      }
      return Boolean(refreshed);
    } catch {
      return false;
    }
  };

  const value: KeycloakAuthContextValue = {
    keycloak: keycloakInstance,
    initialized,
    authenticated,
    token,
    user,
    roles,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isTenantAdmin,
    refreshToken,
  };

  if (!initialized && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  return (
    <KeycloakAuthContext.Provider value={value}>
      {children}
    </KeycloakAuthContext.Provider>
  );
}

export function useAuth(): KeycloakAuthContextValue {
  const context = useContext(KeycloakAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a KeycloakProvider");
  }
  return context;
}
