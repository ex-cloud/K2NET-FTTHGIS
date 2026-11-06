import React from "react";
import {
  KeyRound,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import type { AuthLoginFormProps } from "./auth-login-types";
import type { UseAuthLoginFormReturn } from "./use-auth-login-form";

export interface AuthLoginCredentialsProps {
  form: UseAuthLoginFormReturn;
  props: AuthLoginFormProps;
}

export function AuthLoginCredentials({ form, props }: AuthLoginCredentialsProps) {
  const {
    savedProfiles,
    usernameOrEmail,
    setUsernameOrEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    saveEmailOnDevice,
    setSaveEmailOnDevice,
    totpCode,
    setTotpCode,
    showForgotHelp,
    turnstileContainerRef,
    passwordInputRef,
    handleSubmit,
    handleForgotClick,
    handleBackFromMfa,
    handleBackToSavedProfiles,
    copy,
    resolvedSubmitLabel,
    socialMethods,
    isSubmitDisabled,
    isSuspended,
    isBreakGlass,
    setIsBreakGlass,
    discoveredSso,
  } = form;

  const {
    mfaRequired = false,
    turnstileSiteKey,
    isLoading = false,
    onContinueWithProvider,
    enforceSso = false,
    allowBreakGlass = true,
    ssoProviderType,
    ssoDisplayName,
  } = props;

  return (
    <>
      {/* Social SSO Buttons ABOVE Form (when supported & enabled) */}
      {!mfaRequired && socialMethods.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-2">
            {socialMethods.map((method) => {
              const isGoogle = method.icon === "google" || method.id?.toLowerCase() === "google";
              const isGithub = method.icon === "github" || method.id?.toLowerCase() === "github";
              const methodLabel = isGoogle
                ? copy.continueWithGoogle
                : isGithub
                ? copy.continueWithGithub
                : `${copy.continueWithProviderPrefix} ${method.name}`;

              return (
                <Button
                  key={method.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs font-medium justify-center gap-2 border-border/80 bg-background/50 hover:bg-accent hover:text-foreground rounded-md transition-all shadow-xs cursor-pointer"
                  onClick={() => onContinueWithProvider && onContinueWithProvider(method.id)}
                  disabled={isLoading || isSuspended}
                >
                  {isGoogle && <GoogleIcon className="size-3.5" />}
                  {isGithub && <GithubIcon className="size-3.5" />}
                  {!isGoogle && !isGithub && (
                    <KeyRound className="size-3.5 text-muted-foreground" />
                  )}
                  <span>{methodLabel}</span>
                </Button>
              );
            })}
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-border/60" />
            <span className="absolute bg-card px-2.5 text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
              {copy.orContinueWith}
            </span>
          </div>
        </div>
      )}

      {/* Credentials & Inline MFA Form */}
      {enforceSso && !isBreakGlass && !mfaRequired ? (
        <div className="space-y-4 py-2 animate-in fade-in duration-150">
          <div className="rounded-lg border border-border/80 bg-muted/40 p-4 text-center space-y-2">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-muted border border-border text-foreground mx-auto">
              <KeyRound className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                {ssoDisplayName || copy.defaultSsoDisplayName}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {copy.ssoDiscoveredDesc}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full h-8 text-xs font-medium justify-center gap-2 mt-2"
              onClick={() => onContinueWithProvider && onContinueWithProvider(ssoProviderType || discoveredSso?.providerType || "sso")}
              disabled={isLoading || isSuspended}
            >
              <KeyRound className="size-3.5" />
              <span>{copy.continueWithSso}</span>
            </Button>
          </div>

          {allowBreakGlass && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsBreakGlass(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ShieldAlert className="size-3 text-amber-500" />
                <span>{copy.breakGlassToggle}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!mfaRequired ? (
            <>
              {/* Break-Glass Emergency Warning Banner */}
              {enforceSso && isBreakGlass && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-1 text-xs text-amber-600 dark:text-amber-400 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <ShieldAlert className="size-4" />
                      <span>{copy.breakGlassModeActive}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBreakGlass(false)}
                      className="text-[11px] underline hover:no-underline font-normal cursor-pointer"
                    >
                      {copy.cancelBreakGlass}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
                    {copy.breakGlassNotice}
                  </p>
                </div>
              )}

              {/* Account Email or Username Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="usernameOrEmail"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {copy.accountEmailOrUsername}
                  </Label>
                  <span className="text-[10px] text-muted-foreground bg-muted/60 border border-border px-1.5 py-0.5 rounded font-mono">
                    {copy.requiredBadge}
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="usernameOrEmail"
                    name="username"
                    type="text"
                    autoComplete="username webauthn"
                    placeholder={copy.accountPlaceholder}
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="pl-9 h-9 bg-background/80 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-background focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-foreground/50 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]"
                    disabled={isLoading || isSuspended}
                    required
                  />
                </div>

                {/* Discovered SSO IdP Suggestion */}
                {discoveredSso && !enforceSso && (
                  <div className="rounded-md border border-border/80 bg-muted/40 p-2.5 flex items-center justify-between gap-2 animate-in fade-in mt-1.5">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-foreground block">
                        {copy.ssoDiscoveredTitle}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {discoveredSso.displayName || discoveredSso.providerType || copy.defaultSsoDisplayName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="h-6 text-[11px] px-2 font-medium gap-1"
                      onClick={() => {
                        if (discoveredSso.redirectUrl && typeof window !== "undefined") {
                          window.location.href = discoveredSso.redirectUrl;
                        } else if (onContinueWithProvider) {
                          onContinueWithProvider(discoveredSso.providerType || ssoProviderType || "sso");
                        }
                      }}
                    >
                      <KeyRound className="size-3" />
                      <span>{copy.continueWithSso}</span>
                    </Button>
                  </div>
                )}
              </div>

            {/* Password Input + Forgot Password + Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="accountPassword"
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {copy.passwordUpper}
                </Label>
                <button
                  type="button"
                  onClick={handleForgotClick}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {copy.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="accountPassword"
                  name="password"
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-9 bg-background/80 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-background focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-foreground/50 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]"
                  disabled={isLoading || isSuspended}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                  title={showPassword ? copy.hidePassword : copy.showPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {showForgotHelp && (
                <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border/60 rounded-md p-2 leading-relaxed">
                  {copy.forgotPasswordNotice}
                </p>
              )}
            </div>

            {/* Checkbox: Save email and login method on this device */}
            <div className="space-y-2 pt-0.5">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveEmailOnDevice}
                  onChange={(e) => setSaveEmailOnDevice(e.target.checked)}
                  disabled={isLoading || isSuspended}
                  className="size-3.5 rounded border-border bg-background accent-foreground cursor-pointer"
                />
                <span>{copy.saveEmailOnDevice}</span>
              </label>

              {/* Remember Me Browser */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading || isSuspended}
                    className="size-3.5 rounded border-border bg-background accent-foreground cursor-pointer"
                  />
                  <span>{copy.rememberMeBrowser}</span>
                </label>
              </div>
            </div>

            {/* Optional Cloudflare Turnstile Anti-Bot Widget */}
            {Boolean(turnstileSiteKey?.trim()) && (
              <div className="pt-1">
                <div ref={turnstileContainerRef} className="min-h-[65px] w-full overflow-hidden rounded-md" />
              </div>
            )}
          </>
        ) : (
          /* Inline 6-Digit MFA OTP Mode */
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Smartphone className="size-3.5 text-muted-foreground" />
                <span>{copy.mfaCodeLabel}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {copy.mfaCodeHint}
              </p>
            </div>

            <div className="space-y-1.5">
              <Input
                id="totpCode"
                name="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                placeholder={copy.mfaCodePlaceholder}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                className="h-9 text-center font-mono tracking-[0.4em] text-sm bg-background/80 border-border/70 rounded-md text-foreground focus:bg-background focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-foreground/50 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]"
                disabled={isLoading || isSuspended}
                required
              />
            </div>

            <button
              type="button"
              onClick={handleBackFromMfa}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3" />
              <span>{copy.mfaBackToLogin}</span>
            </button>
          </div>
        )}

        {/* Primary Submit Button (Monochrome High-Contrast: Black on Light, White on Dark) */}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitDisabled}
          className="w-full h-8 font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <span>{resolvedSubmitLabel}</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>

        {/* "View saved profiles" (ONLY rendered if savedProfiles.length > 0) */}
        {!mfaRequired && savedProfiles.length > 0 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleBackToSavedProfiles}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>{copy.viewSavedProfiles}</span>
            </button>
          </div>
        )}
      </form>
      )}
    </>
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
        d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.57l4.03 3.15c.95-2.83 3.6-4.97 6.72-4.97Z"
      />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

