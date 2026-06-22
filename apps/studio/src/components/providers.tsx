"use client";

import type { Session } from "next-auth";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { AuthGuard } from "./auth-guard";
import { Toaster } from "sonner";

import { QueryProvider } from "./query-provider";
import { ErrorBoundary } from "./error-boundary";

export function Providers({ children, session }: { children: React.ReactNode, session?: Session | null }) {
  return (
    <SessionProvider session={session} refetchInterval={300} refetchOnWindowFocus={true}>
      <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <AuthGuard>{children}</AuthGuard>
            </ErrorBoundary>
            <Toaster />
          </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
