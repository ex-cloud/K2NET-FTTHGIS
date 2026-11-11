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
import { AuthMfaStepUp } from "./auth-mfa-step-up";
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
    availableMfaMethods,
    maskedEmail,
    onVerifyTotp,
    onSendEmailOtp,
    onVerifyEmailOtp,
    onVerifyWebauthn,
    onPasswordlessPasskeyLogin,
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
              {/* Top SSO Button for Hybrid Mode (Kondisi C) */}
              {props.hasSso && !enforceSso && (
                <div className="space-y-3 pb-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs font-medium justify-center gap-2 border-border/80 hover:bg-muted/60 transition-colors"
                    onClick={() =>
                      onContinueWithProvider &&
                      onContinueWithProvider(ssoProviderType || "sso")
                    }
                    disabled={isLoading || isSuspended}
                  >
                    <KeyRound className="size-3.5" />
                    <span>
                      {copy.continueWithSso}
                      {ssoDisplayName ? ` (${ssoDisplayName})` : ""}
                    </span>
                  </Button>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <span className="relative bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {copy.orContinueWithCredentials}
                    </span>
                  </div>
                </div>
              )}

              {/* Break-Glass Emergency Warning Banner */}
              {enforceSso && isBreakGlass && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-1 text-xs text-amber-600 dark:text-amber-400 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <ShieldAlert className="size-4 shrink-0" />
                      <span>{copy.breakGlassModeActive}</span>
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

                    {/* Domain Recognized Hint (Strictly Scoped to Current Tenant) */}
                    {discoveredSso && !enforceSso && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 animate-in fade-in">
                        <KeyRound className="size-3 text-primary shrink-0" />
                        <span>
                          {copy.ssoDomainRecognized}
                          {discoveredSso.displayName || ssoDisplayName
                            ? ` (${discoveredSso.displayName || ssoDisplayName})`
                            : ""}
                        </span>
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
                  <div className="pt-0.5">
                    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveEmailOnDevice}
                        onChange={(e) => {
                          setSaveEmailOnDevice(e.target.checked);
                          setRememberMe(e.target.checked);
                        }}
                        disabled={isLoading || isSuspended}
                        className="size-3.5 rounded border-border bg-background accent-foreground cursor-pointer"
                      />
                      <span>{copy.saveEmailOnDevice}</span>
                    </label>
                  </div>

                  {/* Optional Cloudflare Turnstile Anti-Bot Widget */}
                  {Boolean(turnstileSiteKey?.trim()) && (
                    <div className="pt-1">
                      <div ref={turnstileContainerRef} className="min-h-[65px] w-full overflow-hidden rounded-md" />
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

                  {/* Passkey Passwordless Login (Linear style) */}
                  {onPasswordlessPasskeyLogin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onPasswordlessPasskeyLogin}
                      disabled={isLoading || isSuspended}
                      className="w-full h-8 text-xs font-medium justify-center gap-2 border-border/70 bg-background/60 text-foreground/90 hover:bg-accent hover:text-foreground rounded-md transition-colors shadow-2xs cursor-pointer"
                    >
                      <KeyRound className="size-3.5" />
                      <span>{props.labels?.continueWithPasskey || "Log in with passkey"}</span>
                    </Button>
                  )}
                </>
              ) : (
              /* Multi-Option Step-Up MFA Gate (TOTP, WebAuthn Passkeys, Email OTP) */
              <AuthMfaStepUp
                availableMethods={availableMfaMethods}
                maskedEmail={maskedEmail}
                totpCode={totpCode}
                setTotpCode={setTotpCode}
                onVerifyTotp={onVerifyTotp}
                onSendEmailOtp={onSendEmailOtp}
                onVerifyEmailOtp={onVerifyEmailOtp}
                onVerifyWebauthn={onVerifyWebauthn}
                onBackToLogin={handleBackFromMfa}
                labels={props.labels}
                isLoading={isLoading}
              />
        )}

              {/* Monochrome Social / Enterprise SSO Buttons BELOW Form (only when licensed & explicitly activated by Tenant Admin) */}
              {!mfaRequired && socialMethods.length > 0 && (
                <div className="space-y-3 pt-1.5">
                  <div className="relative flex items-center justify-center py-1">
                    <div className="w-full border-t border-border/60" />
                    <span className="absolute bg-sidebar px-2.5 text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
                      {copy.orContinueWith}
                    </span>
                  </div>

                  <div className={socialMethods.length === 2 ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 gap-2"}>
                    {socialMethods.map((method) => {
                      const iconKey = (method.icon || method.id || "").toLowerCase();
                      const isGoogle = iconKey === "google";
                      const isGithub = iconKey === "github";
                      const isMicrosoft = iconKey === "microsoft" || iconKey === "microsoft_entra";
                      const hasCustomName =
                        Boolean(method.name) &&
                        method.name.toLowerCase() !== "google" &&
                        method.name.toLowerCase() !== "github";
                      const methodLabel =
                        socialMethods.length === 2 && !hasCustomName
                          ? method.name
                          : isGoogle && !hasCustomName
                            ? copy.continueWithGoogle
                            : isGithub && !hasCustomName
                              ? copy.continueWithGithub
                              : `${copy.continueWithProviderPrefix} ${method.name}`;

                      return (
                        <Button
                          key={method.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-medium justify-center gap-2 border-border/70 bg-background/60 text-foreground/90 hover:bg-accent hover:text-foreground hover:border-border rounded-md transition-colors shadow-2xs cursor-pointer"
                          onClick={() => onContinueWithProvider && onContinueWithProvider(method.id)}
                          disabled={isLoading || isSuspended}
                        >
                          {isGoogle && <GoogleIcon className="size-3.5 shrink-0" />}
                          {isGithub && <GithubIcon className="size-3.5 shrink-0" />}
                          {isMicrosoft && <MicrosoftIcon className="size-3.5 shrink-0" />}
                          {!isGoogle && !isGithub && !isMicrosoft && (
                            <KeyRound className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">{methodLabel}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* Cancel Break-Glass & return to SSO action (bottom of form, like Forgot Password back link) */}
              {!mfaRequired && Boolean(enforceSso) && isBreakGlass && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setIsBreakGlass(false)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>{copy.cancelBreakGlass || "Return to SSO"}</span>
                  </button>
                </div>
              )}
            </form>
      )}
        </>
      );
}

      function GoogleIcon({className}: {className ?: string}) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
      </svg>
      );
}

      function MicrosoftIcon({className}: {className ?: string}) {
  return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.4 2H2v9.4h9.4V2Zm10.6 0h-9.4v9.4H22V2ZM11.4 12.6H2V22h9.4v-9.4Zm10.6 0h-9.4V22H22v-9.4Z" />
      </svg>
      );
}

      function GithubIcon({className}: {className ?: string}) {
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

