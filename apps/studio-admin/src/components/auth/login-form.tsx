"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, Suspense, useState, useEffect } from "react";
import { Loader2, LogIn, AlertCircle, Building2, Chrome, Github, Key } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@k2net/ui";
import { Input } from "@k2net/ui";
import { Checkbox } from "@k2net/ui";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@k2net/ui";

import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { authenticate, type LoginState } from "@/lib/actions/auth";

function LoginFormInner({ isAdmin = false, prefilledOrg }: { isAdmin?: boolean, prefilledOrg?: string }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");

  const [state, formAction, isPending] = useActionState<
    LoginState | undefined,
    FormData
  >(authenticate, undefined);

  const detectedSubdomain = prefilledOrg || null;

  // Auto-detect if we are on the system subdomain via window.location
  const isSystemSubdomain = typeof window !== "undefined" && (window.location.hostname.startsWith("system.") || window.location.hostname.startsWith("system-"));
  const effectiveIsAdmin = isAdmin || isSystemSubdomain;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      org: effectiveIsAdmin ? "system" : prefilledOrg || "",
      username: "",
      password: "",
    },
  });

  const orgValue = useWatch({
    control: form.control,
    name: "org",
    defaultValue: "",
  });
  
  const baseUrl = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "https://auth-gis.k2net.id";
  const currentRealm = orgValue && orgValue !== "system" ? orgValue : "ftth-realm";
  
  const resetPasswordUrl = `${baseUrl}/realms/${currentRealm}/protocol/openid-connect/auth?client_id=ftth-gis-frontend&response_type=code&scope=openid&kc_action=PASSWORD_RESET`;

  // Track device cookie and suspension status
  const [isSuspended, setIsSuspended] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      let deviceId = getCookie("device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        // Persistent cookie for 1 year
        document.cookie = `device_id=${deviceId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;
      }

      const checkSuspension = async () => {
        try {
          const res = await fetch(`/api/v1/auth/oauth-gate/check-suspension?device_id=${deviceId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.suspended) {
              setIsSuspended(true);
              setRemainingTime(data.remainingSeconds);
            }
          }
        } catch (err) {
          console.error("Failed to check device suspension status:", err);
        }
      };

      checkSuspension();
    }
  }, []);

  const handleSocialLogin = (provider: "google" | "github") => {
    const org = orgValue || (isSystemSubdomain ? "system" : "ftth-realm");
    const targetUrl = callbackUrl || (org === "system" ? "/organizations" : "/dashboard");
    
    // Always route through device verification
    const otpRedirectUrl = `/login/otp?callbackUrl=${encodeURIComponent(targetUrl)}`;

    toast.loading(`Mengarahkan Anda ke ${provider === "google" ? "Google" : "GitHub"}...`);
    signIn("keycloak", { 
      callbackUrl: otpRedirectUrl,
    }, { 
      kc_idp_hint: provider,
      prompt: "select_account" // Force account selection to clear browser sticky session issues
    });
  };

  const handleSSOLogin = () => {
    const org = orgValue || (isSystemSubdomain ? "system" : "ftth-realm");
    const targetUrl = callbackUrl || (org === "system" ? "/organizations" : "/dashboard");
    
    // Always route through device verification
    const otpRedirectUrl = `/login/otp?callbackUrl=${encodeURIComponent(targetUrl)}`;

    toast.loading("Mengarahkan Anda ke Portal Autentikasi SSO Keycloak...");
    signIn("keycloak", { 
      callbackUrl: otpRedirectUrl,
    }, { 
      prompt: "login" // Force Keycloak login page to display
    });
  };

  // Map common error codes to user-friendly messages
  let oauthError = null;
  if (errorParam) {
    if (errorParam === "not_registered") {
      oauthError = "Akun Google Anda tidak terdaftar di sistem. Silakan hubungi Administrator untuk mendapatkan undangan.";
    } else if (errorParam === "suspended") {
      oauthError = "Akses ditangguhkan karena terlalu banyak percobaan login yang gagal.";
    } else if (errorParam === "AccessDenied" || errorParam === "access_denied") {
      oauthError = "Akses ditolak oleh penyedia layanan autentikasi.";
    } else if (errorParam === "OAuthCallback" || errorParam === "OAuthSignin") {
      oauthError = "Terjadi kesalahan saat menghubungkan ke akun Google/GitHub Anda.";
    } else {
      oauthError = `Autentikasi gagal: ${errorParam}`;
    }
  }

  // RP-Initiated OIDC Logout to cleanly clear Keycloak session cookies
  const keycloakLogoutUrl = `${baseUrl}/realms/${currentRealm}/protocol/openid-connect/logout?client_id=ftth-gis-frontend&post_logout_redirect_uri=${encodeURIComponent(
    (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "https://system-gis.k2net.id") + "/login"
  )}`;

  // Blocked device / suspension card UI
  if (isSuspended || errorParam === "suspended") {
    const hours = Math.ceil((remainingTime || 86400) / 3600);
    return (
      <div className="text-center py-4 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-inner">
          <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2.5">Halaman Login Ditangguhkan</h2>
        <p className="text-xs text-zinc-400 leading-relaxed mb-8 max-w-sm mx-auto">
          Terlalu banyak percobaan masuk yang tidak sah dari perangkat atau koneksi ini. Halaman login ditangguhkan sementara selama {hours} jam ke depan untuk alasan keamanan sistem.
        </p>
        <Button 
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }} 
          className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-lg font-semibold"
        >
          Coba Muat Ulang Halaman
        </Button>
      </div>
    );
  }

  // Enterprise UX: If user is not registered, render a beautiful branded full-card error page 
  // instead of the raw login inputs, and allow them to return back to the login screen dynamically.
  if (errorParam === "not_registered") {
    return (
      <div className="text-center py-4 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-inner">
          <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2.5">Akses Ditolak</h2>
        <p className="text-xs text-zinc-400 leading-relaxed mb-8 max-w-sm mx-auto">
          Akun Google Anda belum terdaftar di platform FTTH GIS. Silakan hubungi Administrator atau Owner organisasi Anda untuk mendapatkan undangan akses bergabung.
        </p>
        <Button 
          type="button"
          onClick={() => {
            // Direct browser to Keycloak logout URL to clear the active Keycloak session
            if (typeof window !== "undefined") {
              window.location.href = keycloakLogoutUrl;
            }
          }} 
          className="w-full h-11 bg-linear-to-r from-primary to-primary/80 hover:from-primary/95 text-white transition-all shadow-lg font-semibold"
        >
          Kembali ke Halaman Login
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="callbackUrl" value={callbackUrl || ""} />
        
        {oauthError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{oauthError}</span>
          </div>
        )}

        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Social Logins (Supabase Style) */}
        <div className="space-y-3">
          {effectiveIsAdmin ? (
            /* System Admin SSO */
            <Button
              type="button"
              variant="outline"
              onClick={handleSSOLogin}
              className="w-full h-11 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              <Key className="w-4 h-4 text-primary" />
              Continue with SSO Keycloak
            </Button>
          ) : (
            /* Tenant Social Logins */
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin("github")}
                className="w-full h-11 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin("google")}
                className="w-full h-11 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <Chrome className="w-4 h-4 text-zinc-100" />
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSSOLogin}
                className="w-full h-11 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-100 hover:text-white flex items-center justify-center gap-2 transition-all opacity-85"
              >
                <Key className="w-4 h-4" />
                Continue with SSO Keycloak
              </Button>
            </>
          )}
        </div>

        {/* Beautiful Or Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-800/80"></div>
          <span className="flex-shrink mx-4 text-zinc-500 text-[10px] uppercase tracking-wider font-bold">or</span>
          <div className="flex-grow border-t border-zinc-800/80"></div>
        </div>

        {!effectiveIsAdmin && !detectedSubdomain && (
          <FormField
            control={form.control}
            name="org"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization ID (Slug)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="e.g. telkom, biznet, system"
                    disabled={isPending}
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Hidden inputs to ensure 'org' is submitted in FormData when the visual field is hidden */}
        {effectiveIsAdmin && <input type="hidden" name="org" value="system" />}
        {!effectiveIsAdmin && detectedSubdomain && <input type="hidden" name="org" value={detectedSubdomain} />}

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">
                Username or Email
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="admin.user or admin@example.com"
                  autoComplete="username"
                  disabled={isPending}
                  className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-foreground/80">Password</FormLabel>
                  <Link
                    href={resetPasswordUrl}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isPending}
                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="remember" disabled={isPending} />
          <label
            htmlFor="remember"
            className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </label>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-primary/25"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export function LoginForm(props: { isAdmin?: boolean, prefilledOrg?: string }) {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
