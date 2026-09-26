import * as React from "react";
import { toast } from "sonner";
import {
  setApiAuthToken,
  getApiAuthToken,
  setImpersonationSessionId,
  getImpersonationSessionId,
} from "./api-client";

interface ImpersonationMetadata {
  sessionId: string;
  targetTenantName: string;
  targetTenantSlug: string;
  expiresAt: string;
}

interface ImpersonationStatusResponse {
  active: boolean;
  remainingSeconds: number;
}

export interface ImpersonationContextValue {
  isImpersonating: boolean;
  sessionId: string | null;
  tenantName: string;
  tenantSlug: string;
  remainingSeconds: number;
  isExiting: boolean;
  exitSession: () => Promise<void>;
  isSessionEnded: boolean;
  endedTenantName: string;
  refreshPermissionsTrigger: number;
}

const META_STORAGE_KEY = "k2net_impersonation_meta";

// Module-level lock to strictly prevent duplicate exchange across rapid re-mounts
let activeExchangingCode: string | null = null;

function computeRemainingSeconds(expiresAtStr?: string): number {
  if (!expiresAtStr) return 0;
  const diff = Math.floor((new Date(expiresAtStr).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
}

function readInitialSession(): {
  isImpersonating: boolean;
  sessionId: string | null;
  tenantName: string;
  tenantSlug: string;
  remainingSeconds: number;
} {
  if (typeof window === "undefined") {
    return {
      isImpersonating: false,
      sessionId: null,
      tenantName: "",
      tenantSlug: "",
      remainingSeconds: 0,
    };
  }

  // Check URL first for fresh exchange code
  const url = new URL(window.location.href);
  const code = url.searchParams.get("impersonate_code");
  if (code) {
    return {
      isImpersonating: true,
      sessionId: null,
      tenantName: "",
      tenantSlug: "",
      remainingSeconds: 1800,
    };
  }

  const savedSessionId = getImpersonationSessionId();
  const savedMetaStr =
    sessionStorage.getItem(META_STORAGE_KEY) ||
    localStorage.getItem(META_STORAGE_KEY);

  if (savedSessionId && savedMetaStr) {
    try {
      const meta: ImpersonationMetadata = JSON.parse(savedMetaStr);
      const remaining = computeRemainingSeconds(meta.expiresAt);
      if (remaining > 0) {
        return {
          isImpersonating: true,
          sessionId: meta.sessionId,
          tenantName: meta.targetTenantName || "",
          tenantSlug: meta.targetTenantSlug || "",
          remainingSeconds: remaining,
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    isImpersonating: false,
    sessionId: null,
    tenantName: "",
    tenantSlug: "",
    remainingSeconds: 0,
  };
}

const ImpersonationContext = React.createContext<ImpersonationContextValue | null>(null);

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const initial = React.useMemo(() => readInitialSession(), []);

  const [isImpersonating, setIsImpersonating] = React.useState(initial.isImpersonating);
  const [sessionId, setSessionId] = React.useState<string | null>(initial.sessionId);
  const [tenantName, setTenantName] = React.useState(initial.tenantName);
  const [tenantSlug, setTenantSlug] = React.useState(initial.tenantSlug);
  const [remainingSeconds, setRemainingSeconds] = React.useState(initial.remainingSeconds);
  const [isExiting, setIsExiting] = React.useState(false);
  const [isSessionEnded, setIsSessionEnded] = React.useState(false);
  const [endedTenantName, setEndedTenantName] = React.useState("");
  const [refreshPermissionsTrigger, setRefreshPermissionsTrigger] = React.useState(0);

  const refreshTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const exchangeAttemptedRef = React.useRef(false);

  const clearSession = React.useCallback((showTerminationModal = false, fallbackName?: string) => {
    setIsImpersonating(false);
    setSessionId(null);
    setTenantName((prevName) => {
      if (showTerminationModal) {
        setEndedTenantName(fallbackName || prevName || "Tenant");
        setIsSessionEnded(true);
      }
      return "";
    });
    setTenantSlug("");
    setImpersonationSessionId(null);
    setApiAuthToken(null);
    setRefreshPermissionsTrigger((prev) => prev + 1);

    if (typeof window !== "undefined") {
      if (showTerminationModal) {
        sessionStorage.setItem("k2net_session_ended", "true");
      }
      sessionStorage.removeItem(META_STORAGE_KEY);
      localStorage.removeItem(META_STORAGE_KEY);
      sessionStorage.removeItem("k2net_impersonating_in_progress");
      localStorage.removeItem("k2net_impersonating_in_progress");
      sessionStorage.removeItem("k2net_impersonation_token");
      localStorage.removeItem("k2net_impersonation_token");
      sessionStorage.removeItem("k2net_impersonation_session_id");
      localStorage.removeItem("k2net_impersonation_session_id");
    }

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Synchronous countdown ticker
  React.useEffect(() => {
    if (isImpersonating && remainingSeconds > 0) {
      if (!countdownIntervalRef.current) {
        countdownIntervalRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              clearSession(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isImpersonating, remainingSeconds, clearSession]);

  const scheduleRefresh = React.useCallback((expiresInSeconds: number, activeSessionId: string) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const delayMs = Math.max((expiresInSeconds - 30) * 1000, 5000);

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const token = getApiAuthToken();
        const res = await fetch("/api/v1/system/impersonate/refresh-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Impersonation-Session-Id": activeSessionId,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) {
            setApiAuthToken(data.accessToken);
            scheduleRefresh(data.expiresInSeconds || 1800, activeSessionId);
            setRefreshPermissionsTrigger((prev) => prev + 1);
          }
        }
      } catch {
        refreshTimeoutRef.current = setTimeout(() => {
          scheduleRefresh(30, activeSessionId);
        }, 10000);
      }
    }, delayMs);
  }, []);

  const pollStatus = React.useCallback(async (activeSessionId: string): Promise<boolean> => {
    try {
      const token = getApiAuthToken();
      const res = await fetch("/api/v1/system/impersonate/status", {
        headers: {
          "X-Impersonation-Session-Id": activeSessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearSession(true);
          return false;
        }
        return false;
      }

      const data: ImpersonationStatusResponse = await res.json();
      if (data.active && data.remainingSeconds > 0) {
        setIsImpersonating(true);
        setRemainingSeconds(data.remainingSeconds);
        return true;
      } else {
        clearSession(true);
        return false;
      }
    } catch {
      // Transient error, do NOT kill active session
      return false;
    }
  }, [clearSession]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const abortController = new AbortController();
    const url = new URL(window.location.href);
    const impersonateCode = url.searchParams.get("impersonate_code");

    if (impersonateCode) {
      if (activeExchangingCode === impersonateCode || exchangeAttemptedRef.current) {
        return;
      }

      activeExchangingCode = impersonateCode;
      exchangeAttemptedRef.current = true;
      sessionStorage.setItem("k2net_impersonating_in_progress", "true");

      (async () => {
        try {
          const res = await fetch("/api/v1/system/impersonate/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: impersonateCode }),
            signal: abortController.signal,
          });

          if (!res.ok) {
            sessionStorage.removeItem("k2net_impersonating_in_progress");
            const err = await res.json().catch(() => ({}));
            toast.error("Gagal Memulai Sesi Impersonasi", {
              description: err.message || "Kode penukaran tidak valid atau sudah kedaluwarsa.",
            });
            return;
          }

          const data = await res.json();
          const {
            sessionId: newSessionId,
            token,
            targetTenantName: name,
            targetTenantSlug: slug,
            expiresInSeconds = 1800,
            expiresAt,
          } = data;

          setApiAuthToken(token);
          setImpersonationSessionId(newSessionId);

          const meta: ImpersonationMetadata = {
            sessionId: newSessionId,
            targetTenantName: name,
            targetTenantSlug: slug,
            expiresAt,
          };
          sessionStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
          localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
          sessionStorage.removeItem("k2net_impersonating_in_progress");

          setIsImpersonating(true);
          setSessionId(newSessionId);
          setTenantName(name);
          setTenantSlug(slug);
          setRemainingSeconds(expiresInSeconds);
          setRefreshPermissionsTrigger((prev) => prev + 1);

          url.searchParams.delete("impersonate_code");
          window.history.replaceState({}, "", url.pathname + url.search);

          toast.success(`Mode Bantuan: Terhubung ke ${name}`);

          scheduleRefresh(expiresInSeconds, newSessionId);

          statusIntervalRef.current = setInterval(() => {
            pollStatus(newSessionId);
          }, 15000);
        } catch (e: unknown) {
          sessionStorage.removeItem("k2net_impersonating_in_progress");
          if (e instanceof Error && (e.name === "AbortError" || e.message.includes("abort"))) {
            return;
          }
          const msg = e instanceof Error ? e.message : "";
          if (
            msg &&
            !msg.includes("NetworkError") &&
            !msg.includes("Failed to fetch") &&
            !msg.includes("Load failed")
          ) {
            toast.error("Gagal Memulai Sesi Impersonasi", { description: msg });
          }
        }
      })();
    } else {
      const savedSessionId = getImpersonationSessionId();
      const savedMetaStr =
        sessionStorage.getItem(META_STORAGE_KEY) ||
        localStorage.getItem(META_STORAGE_KEY);

      if (savedSessionId && savedMetaStr) {
        try {
          const meta: ImpersonationMetadata = JSON.parse(savedMetaStr);
          const initialRemaining = computeRemainingSeconds(meta.expiresAt);

          if (initialRemaining <= 0) {
            clearSession(true, meta.targetTenantName);
            return;
          }

          setIsImpersonating(true);
          setSessionId(meta.sessionId);
          setTenantName(meta.targetTenantName);
          setTenantSlug(meta.targetTenantSlug);
          setRemainingSeconds(initialRemaining);
          setRefreshPermissionsTrigger((prev) => prev + 1);

          scheduleRefresh(initialRemaining, meta.sessionId);

          // Verify in background
          pollStatus(meta.sessionId);
          statusIntervalRef.current = setInterval(() => {
            pollStatus(meta.sessionId);
          }, 15000);
        } catch {
          clearSession();
        }
      }
    }

    return () => {
      abortController.abort();
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [clearSession, pollStatus, scheduleRefresh]);

  const exitSession = React.useCallback(async () => {
    if (!sessionId) return;
    setIsExiting(true);

    try {
      const token = getApiAuthToken();
      const res = await fetch("/api/v1/system/impersonate/exit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Impersonation-Session-Id": sessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        toast.success("Sesi impersonasi berhasil diakhiri.");
      }
    } catch {
      // ignore
    } finally {
      clearSession(false);
      setIsExiting(false);

      if (typeof window !== "undefined") {
        window.close();
        setTimeout(() => {
          window.location.href = "/";
        }, 300);
      }
    }
  }, [sessionId, clearSession]);

  const contextValue = React.useMemo<ImpersonationContextValue>(() => ({
    isImpersonating,
    sessionId,
    tenantName,
    tenantSlug,
    remainingSeconds,
    isExiting,
    exitSession,
    isSessionEnded,
    endedTenantName,
    refreshPermissionsTrigger,
  }), [
    isImpersonating,
    sessionId,
    tenantName,
    tenantSlug,
    remainingSeconds,
    isExiting,
    exitSession,
    isSessionEnded,
    endedTenantName,
    refreshPermissionsTrigger,
  ]);

  return (
    <ImpersonationContext.Provider value={contextValue}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonationSession(): ImpersonationContextValue {
  const context = React.useContext(ImpersonationContext);
  if (!context) {
    return {
      isImpersonating: false,
      sessionId: null,
      tenantName: "",
      tenantSlug: "",
      remainingSeconds: 0,
      isExiting: false,
      exitSession: async () => {},
      isSessionEnded: false,
      endedTenantName: "",
      refreshPermissionsTrigger: 0,
    };
  }
  return context;
}
