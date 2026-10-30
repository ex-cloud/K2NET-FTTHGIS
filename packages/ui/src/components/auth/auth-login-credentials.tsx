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
  } = form;

  const {
    mfaRequired = false,
    turnstileSiteKey,
    isLoading = false,
    onContinueWithProvider,
  } = props;

  return (
    <>
      {/* Social SSO Buttons ABOVE Form (when supported & enabled) */}
      {!mfaRequired && socialMethods.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-2">
            {socialMethods.map((method) => {
              const methodLabel =
                method.icon === "google"
                  ? copy.continueWithGoogle
                  : method.icon === "github"
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
                  {method.icon === "google" && <GoogleIcon className="size-3.5" />}
                  {method.icon === "github" && <GithubIcon className="size-3.5" />}
                  {method.icon !== "google" && method.icon !== "github" && (
                    <KeyRound className="size-3.5 text-primary" />
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
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {!mfaRequired ? (
          <>
            {/* Account Email or Username Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="usernameOrEmail"
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {copy.accountEmailOrUsername}
                </Label>
                <span className="text-[10px] text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded font-mono">
                  {copy.requiredBadge}
                </span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="usernameOrEmail"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder={copy.accountPlaceholder}
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="pl-9 h-9 bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#09090b_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white"
                  disabled={isLoading || isSuspended}
                  required
                />
              </div>
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
                  className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
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
                  className="pl-9 pr-9 h-9 bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#09090b_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white"
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
                  className="size-3.5 rounded border-border bg-background accent-primary cursor-pointer"
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
                    className="size-3.5 rounded border-border bg-background accent-primary cursor-pointer"
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
            <div className="rounded-md border border-primary/25 bg-primary/5 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Smartphone className="size-3.5" />
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
                className="h-9 text-center font-mono tracking-[0.4em] text-sm bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors [color-scheme:dark] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#09090b_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white"
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

        {/* Primary Submit Button */}
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitDisabled}
          className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-md shadow-xs flex items-center justify-center gap-2 transition-all duration-200 group cursor-pointer"
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

        {/* Link below submit button: "View saved profiles" (ONLY rendered if savedProfiles.length > 0) */}
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

