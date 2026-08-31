import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { AuthGuard } from "./auth-guard";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { ErrorBoundary } from "./error-boundary";
import { NetworkStatusIndicator } from "./NetworkStatusIndicator";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
        <NetworkStatusIndicator />
        <Toaster />
      </ThemeProvider>
    </QueryProvider>
  );
}
