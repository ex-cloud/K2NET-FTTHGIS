import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import Keycloak from "keycloak-js";
import type { KeycloakAuthConfig, KeycloakAuthContextValue, KeycloakUser } from "./types";

const KeycloakAuthContext = createContext<KeycloakAuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = "k2net_kc_token";
const REFRESH_TOKEN_STORAGE_KEY = "k2net_kc_refresh_token";
const ID_TOKEN_STORAGE_KEY = "k2net_kc_id_token";

export interface KeycloakProviderProps {
  config: KeycloakAuthConfig;
  children: React.ReactNode;
  initOptions?: Keycloak.KeycloakInitOptions;
  loadingFallback?: React.ReactNode;
}

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

  // Extract roles and user info from Keycloak token parsed claims
  const extractUser = (kc: Keycloak): KeycloakUser | null => {
    if (!kc.tokenParsed) return null;
    const parsed = kc.tokenParsed as KeycloakParsedClaims;

    const realmRoles: string[] = parsed.realm_access?.roles || [];
    const clientRoles: string[] = parsed.resource_access?.[config.clientId]?.roles || [];
    const allRoles = Array.from(new Set([...realmRoles, ...clientRoles])).map((r) =>
      r.toLowerCase().replace(/^role_/, "")
    );

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

  const saveTokens = (t?: string, rt?: string, idt?: string) => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);

      if (rt) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, rt);
      else localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

      if (idt) localStorage.setItem(ID_TOKEN_STORAGE_KEY, idt);
      else localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const clearTokens = () => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isInitializing.current || keycloakInstance) return;
    isInitializing.current = true;

    // Clean up accumulated kc-callback-* keys to prevent localStorage bloat
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("kc-callback-")) {
            keysToRemove.push(key);
          }
        }
        if (keysToRemove.length > 2) {
          keysToRemove.slice(0, keysToRemove.length - 1).forEach((k) => localStorage.removeItem(k));
        }
      } catch {
        // ignore
      }
    }

    const kc = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });

    setKeycloakInstance(kc);

    const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
    const hasAuthCallback = typeof window !== "undefined" && (
      window.location.search.includes("code=") ||
      window.location.search.includes("state=") ||
      window.location.hash.includes("code=") ||
      window.location.hash.includes("state=")
    );

    const storedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) || undefined : undefined;
    const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || undefined : undefined;
    const storedIdToken = typeof window !== "undefined" ? localStorage.getItem(ID_TOKEN_STORAGE_KEY) || undefined : undefined;

    // Fast-path initialization options:
    // If we're on /login without an auth callback and without stored tokens, initialize immediately
    // without running check-sso to avoid 3rd-party cookie iframe timeouts.
    const defaultInitOptions: Keycloak.KeycloakInitOptions = {
      pkceMethod: "S256",
      checkLoginIframe: false,
      enableLogging: false,
      token: storedToken,
      refreshToken: storedRefreshToken,
      idToken: storedIdToken,
      ...initOptions,
    };

    if (hasAuthCallback) {
      // User is returning from Keycloak login redirect: let Keycloak process the code
      defaultInitOptions.onLoad = undefined;
    } else if (storedToken) {
      // User has cached tokens: validate and hydrate directly
      defaultInitOptions.onLoad = "check-sso";
      defaultInitOptions.silentCheckSsoFallback = false;
    } else if (isLoginPage) {
      // On login page without tokens: initialize instantly in 0ms without blocking iframe
      defaultInitOptions.onLoad = undefined;
    } else {
      // On protected route without tokens: check SSO or let route guard handle redirect
      defaultInitOptions.onLoad = undefined;
    }

    const updateWindowAuth = (instance: Keycloak | null, currentUser: KeycloakUser | null) => {
      if (typeof window !== "undefined") {
        if (instance && instance.token && currentUser) {
          (window as any).__K2NET_AUTH__ = {
            token: instance.token,
            refreshToken: instance.refreshToken,
            user: {
              id: currentUser.id,
              sub: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              roles: currentUser.roles,
              username: currentUser.username,
              tenantId: currentUser.tenantId,
              organizationId: currentUser.organizationId || currentUser.tenantId,
              tenantSlug: currentUser.tenantSlug,
              organizationSlug: currentUser.organizationSlug || currentUser.tenantSlug,
              avatar_url: currentUser.avatarUrl,
              permissions: currentUser.permissions,
            },
            login: (opts?: Keycloak.KeycloakLoginOptions) => instance.login(opts),
            logout: (opts?: Keycloak.KeycloakLogoutOptions) => instance.logout(opts),
          };
        } else {
          delete (window as any).__K2NET_AUTH__;
        }
      }
    };

    kc.init(defaultInitOptions)
      .then((auth) => {
        setKeycloakInstance(kc);
        setAuthenticated(Boolean(auth));
        setInitialized(true);

        if (auth && kc.token) {
          saveTokens(kc.token, kc.refreshToken, kc.idToken);
          setToken(kc.token);
          const currentUser = extractUser(kc);
          setUser(currentUser);
          updateWindowAuth(kc, currentUser);
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
        } else {
          clearTokens();
          updateWindowAuth(null, null);
        }
      })
      .catch((err) => {
        console.warn("[KeycloakProvider] Check-SSO unauthenticated:", err);
        setKeycloakInstance(kc);
        setAuthenticated(false);
        setInitialized(true);
        clearTokens();
        updateWindowAuth(null, null);
        if (config.onAuthError) {
          config.onAuthError(err);
        }
      });

    // Auto token refresh listener
    kc.onTokenExpired = () => {
      kc.updateToken(30)
        .then((refreshed) => {
          if (refreshed && kc.token) {
            saveTokens(kc.token, kc.refreshToken, kc.idToken);
            setToken(kc.token);
            const currentUser = extractUser(kc);
            setUser(currentUser);
            updateWindowAuth(kc, currentUser);
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
          clearTokens();
          setAuthenticated(false);
          setToken(null);
          setUser(null);
          updateWindowAuth(null, null);
        });
    };
  }, [config, initOptions]);

  const roles = useMemo(() => user?.roles || [], [user]);

  const hasRole = (role: string): boolean => {
    const cleanRole = role.toLowerCase().replace(/^role_/, "");
    // God mode / Super Admin bypass
    if (roles.includes("super_admin")) {
      return true;
    }
    return roles.includes(cleanRole);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    if (roles.includes("super_admin")) {
      return true;
    }
    return roleList.some((r) => roles.includes(r.toLowerCase().replace(/^role_/, "")));
  };

  const isSuperAdmin = (): boolean => {
    return roles.includes("super_admin");
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
    clearTokens();
    if (typeof window !== "undefined") {
      delete (window as any).__K2NET_AUTH__;
    }
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
        saveTokens(keycloakInstance.token, keycloakInstance.refreshToken, keycloakInstance.idToken);
        setToken(keycloakInstance.token);
        const currentUser = extractUser(keycloakInstance);
        setUser(currentUser);
        if (typeof window !== "undefined") {
          (window as any).__K2NET_AUTH__ = {
            token: keycloakInstance.token,
            refreshToken: keycloakInstance.refreshToken,
            user: {
              id: currentUser?.id,
              sub: currentUser?.id,
              name: currentUser?.name,
              email: currentUser?.email,
              roles: currentUser?.roles,
              username: currentUser?.username,
              tenantId: currentUser?.tenantId,
              organizationId: currentUser?.organizationId || currentUser?.tenantId,
              tenantSlug: currentUser?.tenantSlug,
              organizationSlug: currentUser?.organizationSlug || currentUser?.tenantSlug,
              avatar_url: currentUser?.avatarUrl,
              permissions: currentUser?.permissions,
            },
            login: (opts?: Keycloak.KeycloakLoginOptions) => keycloakInstance.login(opts),
            logout: (opts?: Keycloak.KeycloakLogoutOptions) => keycloakInstance.logout(opts),
          };
        }
      }
      return Boolean(refreshed);
    } catch {
      clearTokens();
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
