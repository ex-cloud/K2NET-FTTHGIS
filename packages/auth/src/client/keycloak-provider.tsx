import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Keycloak from "keycloak-js";
import type {
  AuthPlane,
  CredentialLoginInput,
  CredentialLoginResult,
  KeycloakAuthConfig,
  KeycloakAuthContextValue,
  KeycloakUser,
} from "./types";

const KeycloakAuthContext = createContext<KeycloakAuthContextValue | null>(null);

const LEGACY_STORAGE_KEYS = [
  "k2net_kc_token",
  "k2net_kc_refresh_token",
  "k2net_kc_id_token",
];

export interface KeycloakProviderProps {
  config: KeycloakAuthConfig;
  children: React.ReactNode;
  initOptions?: Keycloak.KeycloakInitOptions;
  loadingFallback?: React.ReactNode;
}

interface KeycloakParsedClaims {
  sub?: string;
  iss?: string;
  exp?: number;
  email?: string;
  preferred_username?: string;
  name?: string;
  organization_id?: string;
  tenant_id?: string;
  tenant_slug?: string;
  permissions?: string[];
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

interface BffAuthUserPayload {
  id: string;
  username: string;
  email?: string;
  name?: string;
  roles?: string[];
  organizationId?: string;
  tenantId?: string;
  tenantSlug?: string;
  realm?: string;
}

interface BffLoginApiResponse {
  accessToken?: string;
  idToken?: string;
  expiresIn?: number;
  realm?: string;
  mfaRequired?: boolean;
  error?: string;
  message?: string;
  user?: BffAuthUserPayload;
}

interface K2NetWindowAuthBridge {
  token: string;
  user: Record<string, unknown>;
  login: (opts?: Keycloak.KeycloakLoginOptions) => Promise<void>;
  logout: (opts?: Keycloak.KeycloakLogoutOptions) => Promise<void>;
  updateToken: (minValidity?: number) => Promise<boolean>;
}

function purgeLegacyStoredTokens(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    for (const k of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(k);
    }
    const callbackKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("kc-callback-")) {
        callbackKeys.push(key);
      }
    }
    if (callbackKeys.length > 2) {
      callbackKeys.slice(0, callbackKeys.length - 1).forEach((k) => window.localStorage.removeItem(k));
    }
  } catch {
    // ignore private browsing storage errors
  }
}

function decodeJwtClaims(jwtToken: string): KeycloakParsedClaims | null {
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3 || !parts[1]) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr) as KeycloakParsedClaims;
  } catch {
    return null;
  }
}

function normalizeRoles(rawRoles: string[]): string[] {
  return Array.from(
    new Set(
      rawRoles
        .filter(Boolean)
        .map((r) => r.toLowerCase().trim().replace(/^role_/, ""))
    )
  );
}

function buildKeycloakUser(
  accessToken: string,
  clientId: string,
  bffUser?: BffAuthUserPayload
): KeycloakUser | null {
  const claims = decodeJwtClaims(accessToken);
  if (!claims && !bffUser) return null;

  const realmRoles = claims?.realm_access?.roles || [];
  const clientRoles = claims?.resource_access?.[clientId]?.roles || [];
  const bffRoles = bffUser?.roles || [];
  const roles = normalizeRoles([...realmRoles, ...clientRoles, ...bffRoles]);

  const orgId =
    bffUser?.organizationId ||
    claims?.organization_id ||
    bffUser?.tenantId ||
    claims?.tenant_id;
  const slug = bffUser?.tenantSlug || claims?.tenant_slug;
  const sub = bffUser?.id || claims?.sub || "";
  const username = bffUser?.username || claims?.preferred_username || sub || "user";

  return {
    id: sub,
    email: bffUser?.email || claims?.email,
    username,
    name: bffUser?.name || claims?.name || username,
    roles,
    tenantId: orgId,
    organizationId: orgId,
    tenantSlug: slug,
    organizationSlug: slug,
    permissions: claims?.permissions,
    issuer: claims?.iss,
  };
}

function resolvePlane(config: KeycloakAuthConfig): AuthPlane {
  if (config.plane) return config.plane;
  return config.realm === "ftth-realm" ? "PLATFORM" : "TENANT";
}

function hasOAuthCallbackInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const search = window.location.search;
  const hash = window.location.hash;
  return (
    (search.includes("code=") && search.includes("state=")) ||
    (hash.includes("code=") && hash.includes("state="))
  );
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
  const activeTokenRef = useRef<string | null>(null);
  const activeUserRef = useRef<KeycloakUser | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRefreshRef = useRef<Promise<boolean> | null>(null);

  const plane = useMemo(() => resolvePlane(config), [config]);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearWindowBridge = useCallback(() => {
    if (typeof window !== "undefined") {
      delete (window as unknown as { __K2NET_AUTH__?: K2NetWindowAuthBridge }).__K2NET_AUTH__;
    }
  }, []);

  const clearSessionState = useCallback(() => {
    clearRefreshTimer();
    purgeLegacyStoredTokens();
    activeTokenRef.current = null;
    activeUserRef.current = null;
    setAuthenticated(false);
    setToken(null);
    setUser(null);
    clearWindowBridge();
    config.onTokens?.({});
  }, [clearRefreshTimer, clearWindowBridge, config]);

  const performBffRefresh = useCallback(async (): Promise<BffLoginApiResponse | null> => {
    try {
      const res = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "K2NET-BFF",
        },
        body: JSON.stringify({
          realm: config.realm,
          plane,
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as BffLoginApiResponse;
      return data.accessToken ? data : null;
    } catch {
      return null;
    }
  }, [config.realm, plane]);

  const refreshTokenRef = useRef<(minValidity?: number) => Promise<boolean>>(async () => false);
  const loginFnRef = useRef<(options?: Keycloak.KeycloakLoginOptions) => Promise<void>>(async () => {});
  const logoutFnRef = useRef<(options?: Keycloak.KeycloakLogoutOptions) => Promise<void>>(async () => {});

  const syncWindowBridge = useCallback((accessToken: string, currentUser: KeycloakUser) => {
    if (typeof window === "undefined") return;
    (window as unknown as { __K2NET_AUTH__?: K2NetWindowAuthBridge }).__K2NET_AUTH__ = {
      token: accessToken,
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
      login: (opts?: Keycloak.KeycloakLoginOptions) => loginFnRef.current(opts),
      logout: (opts?: Keycloak.KeycloakLogoutOptions) => logoutFnRef.current(opts),
      updateToken: (minValidity?: number) => refreshTokenRef.current(minValidity),
    };
  }, []);

  const scheduleSilentRefresh = useCallback(
    (expiresInSeconds?: number) => {
      clearRefreshTimer();
      const ttlSeconds = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 300;
      const refreshDelayMs = Math.max((ttlSeconds - 45) * 1000, 15000);
      refreshTimerRef.current = setTimeout(() => {
        void refreshTokenRef.current(30);
      }, refreshDelayMs);
    },
    [clearRefreshTimer]
  );

  const hydrateAuthenticatedSession = useCallback(
    (accessToken: string, idToken: string | undefined, expiresIn: number | undefined, bffUser?: BffAuthUserPayload): KeycloakUser | null => {
      const resolvedUser = buildKeycloakUser(accessToken, config.clientId, bffUser);
      if (!resolvedUser) return null;

      activeTokenRef.current = accessToken;
      activeUserRef.current = resolvedUser;
      setToken(accessToken);
      setUser(resolvedUser);
      setAuthenticated(true);
      syncWindowBridge(accessToken, resolvedUser);

      config.onTokens?.({
        token: accessToken,
        idToken,
      });
      config.onAuthSuccess?.(resolvedUser);
      scheduleSilentRefresh(expiresIn);
      return resolvedUser;
    },
    [config, scheduleSilentRefresh, syncWindowBridge]
  );

  const refreshToken = useCallback(
    async (minValidity: number = 30): Promise<boolean> => {
      if (activeTokenRef.current) {
        const claims = decodeJwtClaims(activeTokenRef.current);
        if (claims?.exp) {
          const remainingSec = claims.exp - Math.floor(Date.now() / 1000);
          if (remainingSec > minValidity && minValidity > 0) {
            return true;
          }
        }
      }

      if (inflightRefreshRef.current) {
        return inflightRefreshRef.current;
      }

      inflightRefreshRef.current = (async () => {
        try {
          // If browser is currently offline, prevent failed network request that would clear active session
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            return false;
          }

          const bffRefreshed = await performBffRefresh();
          if (bffRefreshed?.accessToken) {
            const hydrated = hydrateAuthenticatedSession(
              bffRefreshed.accessToken,
              bffRefreshed.idToken,
              bffRefreshed.expiresIn,
              bffRefreshed.user
            );
            return Boolean(hydrated);
          }

          if (keycloakInstance?.authenticated) {
            const refreshed = await keycloakInstance.updateToken(minValidity);
            if (refreshed && keycloakInstance.token) {
              const hydrated = hydrateAuthenticatedSession(
                keycloakInstance.token,
                keycloakInstance.idToken,
                undefined
              );
              return Boolean(hydrated);
            }
          }

          // Only clear session state if the client is definitely online and refresh was rejected by server
          if (typeof navigator === "undefined" || navigator.onLine) {
            clearSessionState();
          }
          return false;
        } catch {
          if (typeof navigator === "undefined" || navigator.onLine) {
            clearSessionState();
          }
          return false;
        } finally {
          inflightRefreshRef.current = null;
        }
      })();

      return inflightRefreshRef.current;
    },
    [clearSessionState, hydrateAuthenticatedSession, keycloakInstance, performBffRefresh]
  );

  const login = useCallback(
    async (options?: Keycloak.KeycloakLoginOptions) => {
      // Only trigger external OIDC broker redirect when an explicit social/enterprise IdP hint is requested
      if (options?.idpHint) {
        const redirectTarget = options.redirectUri || window.location.origin + "/";
        if (keycloakInstance) {
          try {
            await keycloakInstance.login({
              ...options,
              redirectUri: redirectTarget,
            });
            return;
          } catch {
            // fallback to explicit OIDC authorization URL with kc_idp_hint
          }
        }
        const authUrl = `${config.url}/realms/${encodeURIComponent(config.realm)}/protocol/openid-connect/auth?client_id=${encodeURIComponent(config.clientId)}&redirect_uri=${encodeURIComponent(redirectTarget)}&response_type=code&scope=openid%20profile%20email&kc_idp_hint=${encodeURIComponent(options.idpHint)}`;
        window.location.assign(authUrl);
        return;
      }

      // Native Cloudflare-style login: navigate internally to /login without redirecting to auth-gis.kdua.net
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        const currentPath = window.location.pathname + window.location.search;
        const target =
          currentPath && currentPath !== "/"
            ? `/login?callbackUrl=${encodeURIComponent(currentPath)}`
            : "/login";
        window.location.replace(target);
      }
    },
    [config.clientId, config.realm, config.url, keycloakInstance]
  );

  const loginWithCredentials = useCallback(
    async (input: CredentialLoginInput): Promise<CredentialLoginResult> => {
      try {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "K2NET-BFF",
          },
          body: JSON.stringify({
            plane: input.plane || plane,
            tenantSlug: input.tenantSlug || config.tenantSlug,
            username: input.username.trim(),
            password: input.password,
            totp: input.totp?.trim() || undefined,
            rememberMe: Boolean(input.rememberMe),
            turnstileToken: input.turnstileToken || undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as BffLoginApiResponse;

        if (data.mfaRequired) {
          return {
            success: false,
            mfaRequired: true,
            error: data.error,
            message: data.message,
          };
        }

        if (!res.ok || !data.accessToken) {
          return {
            success: false,
            error: data.error || "INVALID_CREDENTIALS",
            message: data.message,
          };
        }

        const hydratedUser = hydrateAuthenticatedSession(
          data.accessToken,
          data.idToken,
          data.expiresIn,
          data.user
        );

        if (!hydratedUser) {
          return {
            success: false,
            error: "TOKEN_PARSE_ERROR",
            message: "Failed to parse authentication session.",
          };
        }

        return {
          success: true,
          user: hydratedUser,
        };
      } catch (err) {
        config.onAuthError?.(err);
        return {
          success: false,
          error: "NETWORK_ERROR",
        };
      }
    },
    [config, hydrateAuthenticatedSession, plane]
  );

  const logout = useCallback(
    async (options?: Keycloak.KeycloakLogoutOptions) => {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "K2NET-BFF",
          },
          body: JSON.stringify({
            realm: config.realm,
            plane,
            tenantSlug: config.tenantSlug,
          }),
        });
      } catch {
        // Proceed with local state cleanup even if network is offline
      }

      clearSessionState();

      if (keycloakInstance?.authenticated) {
        await keycloakInstance.logout({
          redirectUri: options?.redirectUri || window.location.origin + "/login",
          ...options,
        });
        return;
      }

      if (typeof window !== "undefined") {
        window.location.replace(options?.redirectUri || "/login");
      }
    },
    [clearSessionState, config.realm, config.tenantSlug, keycloakInstance, plane]
  );

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
    loginFnRef.current = login;
    logoutFnRef.current = logout;
  }, [login, logout, refreshToken]);

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    purgeLegacyStoredTokens();

    const kc = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });
    setKeycloakInstance(kc);

    // Case 1: Returning from Social SSO OAuth2 PKCE redirect (Google / GitHub)
    if (hasOAuthCallbackInUrl()) {
      kc.init({
        pkceMethod: "S256",
        checkLoginIframe: false,
        enableLogging: false,
        ...initOptions,
      })
        .then((auth) => {
          if (auth && kc.token) {
            hydrateAuthenticatedSession(kc.token, kc.idToken, undefined);
          } else {
            clearSessionState();
          }
          setInitialized(true);
        })
        .catch((err) => {
          clearSessionState();
          setInitialized(true);
          config.onAuthError?.(err);
        });
      return;
    }

    // Case 2: Standard Edge BFF silent cookie hydration (< 5ms, zero 3rd-party iframe)
    void (async () => {
      const bffSession = await performBffRefresh();
      if (bffSession?.accessToken) {
        hydrateAuthenticatedSession(
          bffSession.accessToken,
          bffSession.idToken,
          bffSession.expiresIn,
          bffSession.user
        );
      } else {
        clearSessionState();
      }
      setInitialized(true);
    })();

    return () => {
      clearRefreshTimer();
    };
  }, [
    clearRefreshTimer,
    clearSessionState,
    config,
    hydrateAuthenticatedSession,
    initOptions,
    performBffRefresh,
  ]);

  // Proactive token refresh when browser tab wakes up from standby or user returns to tab
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkAndRefreshOnWakeup = () => {
      if (document.visibilityState === "visible" && activeTokenRef.current) {
        const claims = decodeJwtClaims(activeTokenRef.current);
        if (claims?.exp) {
          const remainingSec = claims.exp - Math.floor(Date.now() / 1000);
          // If token has expired or is expiring in less than 45 seconds, refresh proactively
          if (remainingSec <= 45) {
            void refreshTokenRef.current(45);
          }
        }
      }
    };

    const handleOnline = () => {
      if (activeTokenRef.current) {
        void refreshTokenRef.current(30);
      }
    };

    document.addEventListener("visibilitychange", checkAndRefreshOnWakeup);
    window.addEventListener("focus", checkAndRefreshOnWakeup);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", checkAndRefreshOnWakeup);
      window.removeEventListener("focus", checkAndRefreshOnWakeup);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const roles = useMemo(() => user?.roles || [], [user]);

  const hasRole = useCallback(
    (role: string): boolean => {
      const cleanRole = role.toLowerCase().replace(/^role_/, "");
      if (roles.includes("super_admin")) {
        return true;
      }
      return roles.includes(cleanRole);
    },
    [roles]
  );

  const hasAnyRole = useCallback(
    (roleList: string[]): boolean => {
      if (roles.includes("super_admin")) {
        return true;
      }
      return roleList.some((r) => roles.includes(r.toLowerCase().replace(/^role_/, "")));
    },
    [roles]
  );

  const isSuperAdmin = useCallback((): boolean => {
    return roles.includes("super_admin");
  }, [roles]);

  const isTenantAdmin = useCallback((): boolean => {
    return (
      roles.includes("super_admin") ||
      roles.includes("admin") ||
      roles.includes("tenant_owner") ||
      roles.includes("tenant_admin") ||
      roles.includes("isp_admin")
    );
  }, [roles]);

  const value = useMemo<KeycloakAuthContextValue>(
    () => ({
      keycloak: keycloakInstance,
      initialized,
      authenticated,
      token,
      user,
      roles,
      login,
      loginWithCredentials,
      logout,
      hasRole,
      hasAnyRole,
      isSuperAdmin,
      isTenantAdmin,
      refreshToken,
    }),
    [
      authenticated,
      hasAnyRole,
      hasRole,
      initialized,
      isSuperAdmin,
      isTenantAdmin,
      keycloakInstance,
      login,
      loginWithCredentials,
      logout,
      refreshToken,
      roles,
      token,
      user,
    ]
  );

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
