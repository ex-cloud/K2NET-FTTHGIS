import { useState, useEffect, useRef, useCallback } from "react";
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

const META_STORAGE_KEY = "k2net_impersonation_meta";

let activeExchangingCode: string | null = null;

function computeRemainingSeconds(expiresAtStr?: string): number {
  if (!expiresAtStr) return 0;
  const diff = Math.floor((new Date(expiresAtStr).getTime() - Date.now()) / 1000);
  return Math.max(0, diff);
}

export function useImpersonationSession() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [isExiting, setIsExiting] = useState(false);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearSession = useCallback(() => {
    setIsImpersonating(false);
    setSessionId(null);
    setTenantName("");
    setTenantSlug("");
    setImpersonationSessionId(null);
    setApiAuthToken(null);
    activeExchangingCode = null;
    if (typeof window !== "undefined") {
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
  }, []);

  const scheduleRefresh = useCallback((expiresInSeconds: number, activeSessionId: string) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Deterministik timer: expiresIn - 30 detik buffer (Claude AI precision guidance)
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
          }
        } else {
          // Token refresh gagal atau dibatalkan
          clearSession();
        }
      } catch {
        // Retry dalam 10 detik jika network glitch
        refreshTimeoutRef.current = setTimeout(() => {
          scheduleRefresh(30, activeSessionId);
        }, 10000);
      }
    }, delayMs);
  }, [clearSession]);

  const pollStatus = useCallback(async (activeSessionId: string) => {
    try {
      const token = getApiAuthToken();
      const res = await fetch("/api/v1/system/impersonate/status", {
        headers: {
          "X-Impersonation-Session-Id": activeSessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // Defense-in-depth: jika server mengembalikan 401/403, sesi otentikasi sudah tidak sah
        if (res.status === 401 || res.status === 403) {
          toast.info("Sesi impersonasi telah berakhir atau dicabut.");
          clearSession();
        }
        // Jika 500/502/503 atau transient network error, jangan matikan sesi prematur
        return;
      }

      const data: ImpersonationStatusResponse = await res.json();
      if (data.active) {
        setRemainingSeconds(data.remainingSeconds);
      } else {
        toast.info("Sesi impersonasi telah berakhir.");
        clearSession();
      }
    } catch {
      // ignore network blips
    }
  }, [clearSession]);

  // Initial exchange or restore
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const impersonateCode = url.searchParams.get("impersonate_code");

    if (impersonateCode) {
      if (activeExchangingCode === impersonateCode) {
        return; // Guard against duplicate concurrent exchange requests in React StrictMode
      }
      activeExchangingCode = impersonateCode;

      // Set flag penanda proses pertukaran sedang berlangsung agar ProtectedRoute tidak me-redirect
      sessionStorage.setItem("k2net_impersonating_in_progress", "true");

      // 1. Tukar exchange code
      (async () => {
        try {
          const res = await fetch("/api/v1/system/impersonate/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: impersonateCode }),
          });

          if (!res.ok) {
            sessionStorage.removeItem("k2net_impersonating_in_progress");
            const err = await res.json().catch(() => ({}));
            toast.error("Gagal Memulai Sesi Impersonasi", {
              description: err.message || "Kode penukaran tidak valid atau sudah kedaluwarsa.",
            });
            activeExchangingCode = null;
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

          // Set token & session id (tersimpan di memory, sessionStorage, dan localStorage)
          setApiAuthToken(token);
          setImpersonationSessionId(newSessionId);

          // Simpan metadata hanya di sessionStorage (tab-scoped) & bersihkan localStorage
          const meta: ImpersonationMetadata = {
            sessionId: newSessionId,
            targetTenantName: name,
            targetTenantSlug: slug,
            expiresAt,
          };
          sessionStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
          localStorage.removeItem(META_STORAGE_KEY);
          sessionStorage.removeItem("k2net_impersonating_in_progress");

          setIsImpersonating(true);
          setSessionId(newSessionId);
          setTenantName(name);
          setTenantSlug(slug);
          setRemainingSeconds(expiresInSeconds);

          // Bersihkan URL setelah metadata aman di storage
          url.searchParams.delete("impersonate_code");
          window.history.replaceState({}, "", url.pathname + url.search);

          toast.success(`Mode Bantuan: Terhubung ke ${name}`);

          // Jadwalkan refresh deterministik
          scheduleRefresh(expiresInSeconds, newSessionId);

          // Pasang polling status setiap 15 detik untuk sinkronisasi responsif antar tab
          statusIntervalRef.current = setInterval(() => {
            pollStatus(newSessionId);
          }, 15000);
        } catch (e: unknown) {
          sessionStorage.removeItem("k2net_impersonating_in_progress");
          const msg = e instanceof Error ? e.message : "Gagal menukarkan sesi impersonasi";
          toast.error("Terjadi Kesalahan", { description: msg });
          activeExchangingCode = null;
        }
      })();
    } else {
      // 2. Cek sesi impersonasi tersimpan di sessionStorage (dengan migrasi legacy localStorage jika ada)
      const savedSessionId = getImpersonationSessionId();
      let savedMetaStr = sessionStorage.getItem(META_STORAGE_KEY);
      if (!savedMetaStr && typeof window !== "undefined") {
        savedMetaStr = localStorage.getItem(META_STORAGE_KEY);
        if (savedMetaStr) {
          sessionStorage.setItem(META_STORAGE_KEY, savedMetaStr);
          localStorage.removeItem(META_STORAGE_KEY);
        }
      }

      if (savedSessionId && savedMetaStr) {
        try {
          const meta: ImpersonationMetadata = JSON.parse(savedMetaStr);
          const initialRemaining = computeRemainingSeconds(meta.expiresAt);

          if (initialRemaining <= 0) {
            toast.info("Sesi impersonasi telah kedaluwarsa.");
            clearSession();
            return;
          }

          setIsImpersonating(true);
          setSessionId(meta.sessionId);
          setTenantName(meta.targetTenantName);
          setTenantSlug(meta.targetTenantSlug);
          setRemainingSeconds(initialRemaining);

          // Verifikasi ke server seketika (akan langsung clearSession jika server mengembalikan 401/403/active=false)
          pollStatus(meta.sessionId);
          scheduleRefresh(initialRemaining, meta.sessionId);

          statusIntervalRef.current = setInterval(() => {
            pollStatus(meta.sessionId);
          }, 15000);
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }
    }

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [clearSession, pollStatus, scheduleRefresh]);

  const exitSession = async () => {
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
      clearSession();
      setIsExiting(false);

      // Coba tutup tab jika dibuka dari window.open
      if (typeof window !== "undefined") {
        window.close();
        // Fallback jika browser block window.close(): redirect ke login atau root
        setTimeout(() => {
          window.location.href = "/";
        }, 300);
      }
    }
  };

  return {
    isImpersonating,
    sessionId,
    tenantName,
    tenantSlug,
    remainingSeconds,
    isExiting,
    exitSession,
  };
}
