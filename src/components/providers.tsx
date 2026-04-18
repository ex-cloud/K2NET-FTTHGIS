"use client";

import type { Session } from "next-auth";

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { AuthGuard } from "./auth-guard";
import { Toaster } from "sonner";

import { useEffect } from "react";

/**
 * Komponen sinkronisasi sesi proaktif.
 * Bertanggung jawab memastikan klien menyadari sesi yang sudah ada di server/cookie.
 */
function SessionPulse({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const checkRealSession = async () => {
        try {
          // Bypass browser/Next.js fetch cache
          const res = await fetch('/api/auth/session?t=' + Date.now(), { cache: 'no-store' });
          const realSession = await res.json();
          
          if (realSession && Object.keys(realSession).length > 0) {
            const hasReloaded = sessionStorage.getItem('session_pulse_reloaded');
            
            if (!hasReloaded) {
              sessionStorage.setItem('session_pulse_reloaded', 'true');
              window.location.reload();
            }
          }
        } catch (e) {
          console.error("[SessionPulse] Gagal memverifikasi sesi server:", e);
        }
      };

      // Cek langsung saat status unauthenticated
      checkRealSession();
      
      // Pasang pemantau agresif selama 10 detik ke depan (interval 2 detik)
      const monitor = setInterval(checkRealSession, 2000);
      const timeout = setTimeout(() => clearInterval(monitor), 10000);
      
      return () => {
        clearInterval(monitor);
        clearTimeout(timeout);
      };
    } else if (status === 'authenticated') {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('session_pulse_reloaded');
      }
    }
  }, [status]);

  return <>{children}</>;
}

export function Providers({ children, session }: { children: React.ReactNode, session?: Session | null }) {
  return (
    <SessionProvider session={session} refetchInterval={2} refetchOnWindowFocus={true}>
      <SessionPulse>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthGuard>{children}</AuthGuard>
          <Toaster />
        </ThemeProvider>
      </SessionPulse>
    </SessionProvider>
  );
}
