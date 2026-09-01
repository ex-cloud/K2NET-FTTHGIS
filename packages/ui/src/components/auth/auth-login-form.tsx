"use client";

import React, { useState } from "react";
import { Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";

export interface AuthMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
  enabled: boolean;
}

export interface AuthLoginFormProps {
  title?: string;
  description?: string;
  logoUrl?: string;
  orgName?: string;
  allowedMethods?: AuthMethod[];
  primaryAuthMethod?: string;
  onContinueWithEmail?: (email: string) => void;
  onContinueWithProvider?: (providerId: string) => void;
  isLoading?: boolean;
  defaultEmail?: string;
  errorMessage?: string | null;
}

export function AuthLoginForm({
  title = "Welcome back",
  description = "Sign in to access your geospatial workspace.",
  logoUrl,
  orgName,
  allowedMethods = [],
  onContinueWithEmail,
  onContinueWithProvider,
  isLoading = false,
  defaultEmail = "",
  errorMessage = null,
}: AuthLoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinueWithEmail) {
      onContinueWithEmail(email.trim());
    }
  };

  const socialMethods = allowedMethods.filter(
    (m) => m.enabled && (m.type === "social" || m.type === "saml" || m.type === "enterprise")
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Title & Description */}
      <div className="space-y-2 text-center sm:text-left">
        {orgName && (
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-1">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={orgName} className="h-3.5 w-3.5 object-contain" />
            )}
            <span>{orgName}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive animate-in fade-in">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Primary Form: Email / SSO Trigger */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account Email or Username
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="text"
              placeholder="user@kdua.net or admin.user"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-background/50 text-sm focus-visible:ring-primary"
              autoFocus
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold tracking-wide shadow-md shadow-primary/20 group"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <>
              <span>Continue with Keycloak SSO</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>

      {/* Social / External SSO Providers */}
      {socialMethods.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card/90 px-3 text-muted-foreground font-medium backdrop-blur-sm">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid gap-2.5">
            {socialMethods.map((method) => (
              <Button
                key={method.id}
                type="button"
                variant="outline"
                className="w-full h-10 text-xs font-semibold justify-center gap-2.5 border-border/70 hover:bg-accent/80 hover:text-foreground transition-all"
                onClick={() => onContinueWithProvider && onContinueWithProvider(method.id)}
                disabled={isLoading}
              >
                {method.icon === "google" && <GoogleIcon className="h-4 w-4" />}
                {method.icon === "github" && <GithubIcon className="h-4 w-4" />}
                {method.icon !== "google" && method.icon !== "github" && (
                  <KeyRound className="h-4 w-4 text-primary" />
                )}
                <span>Continue with {method.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
