import { headers } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";
import { Network } from "lucide-react";

export default async function LoginPage() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  
  // Extract root domain from NEXT_PUBLIC_APP_URL or hostname
  let rootDomain = "localhost:3000";
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      rootDomain = url.host; // e.g. system-gis.k2net.id or system.gis.k2net.id
    } catch {
      rootDomain = process.env.NEXT_PUBLIC_APP_URL.replace("http://", "").replace("https://", "");
    }
  }

  // Strip system. or system- prefix to get the base domain
  let baseDomain = rootDomain;
  let isHyphen = false;
  if (rootDomain.startsWith("system-")) {
    baseDomain = rootDomain.substring(7);
    isHyphen = true;
  } else if (rootDomain.startsWith("system.")) {
    baseDomain = rootDomain.substring(7);
  }

  let detectedSubdomain = null;
  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    detectedSubdomain = null;
  } else if (isHyphen && hostname.endsWith(`-${baseDomain}`)) {
    detectedSubdomain = hostname.substring(0, hostname.length - baseDomain.length - 1);
  } else if (!isHyphen && hostname.endsWith(`.${baseDomain}`)) {
    detectedSubdomain = hostname.substring(0, hostname.length - baseDomain.length - 1);
  } else if (hostname.includes(".lvh.me") || hostname.includes(".localhost")) {
    // Local development fallback
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const sub = parts[0];
      if (sub !== "www" && sub !== "system") {
        detectedSubdomain = sub;
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

      {/* Animated Network Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-2xl p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-cyan-500 shadow-lg shadow-primary/25 mb-4">
              <Network className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              FTTH GIS
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Fiber To The Home - Geographic Information System
            </p>
          </div>

          {/* Login Form */}
          <LoginForm prefilledOrg={detectedSubdomain || undefined} />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Protected by Enterprise Security
            </p>
          </div>
        </div>

        {/* Bottom Security Badge */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground/50">
            © 2026 FTTH GIS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
