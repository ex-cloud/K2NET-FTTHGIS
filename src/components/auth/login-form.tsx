"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, Suspense } from "react";
import { Loader2, LogIn, AlertCircle, Building2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { authenticate, type LoginState } from "@/lib/actions/auth";

function LoginFormInner({ isAdmin = false, prefilledOrg }: { isAdmin?: boolean, prefilledOrg?: string }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [state, formAction, isPending] = useActionState<
    LoginState | undefined,
    FormData
  >(authenticate, undefined);

  const detectedSubdomain = prefilledOrg || null;

  // Auto-detect if we are on the system subdomain via window.location
  const isSystemSubdomain = typeof window !== "undefined" && window.location.hostname.startsWith("system.");
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
  
  const baseUrl = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_SERVER_URL || "http://localhost:8081";
  const currentRealm = orgValue && orgValue !== "system" ? orgValue : "ftth-realm";
  
  const resetPasswordUrl = `${baseUrl}/realms/${currentRealm}/protocol/openid-connect/auth?client_id=ftth-gis-frontend&response_type=code&scope=openid&kc_action=PASSWORD_RESET`;

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="callbackUrl" value={callbackUrl || ""} />
        
        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>{state.error}</span>
          </div>
        )}

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
