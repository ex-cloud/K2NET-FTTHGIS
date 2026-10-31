import React from "react";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import type { UseAuthLoginFormReturn } from "./use-auth-login-form";
import type { AuthLoginFormProps } from "./auth-login-types";

interface AuthLoginForgotPasswordProps {
  form: UseAuthLoginFormReturn;
  props: AuthLoginFormProps;
}

export function AuthLoginForgotPassword({ form, props }: AuthLoginForgotPasswordProps) {
  const {
    usernameOrEmail,
    setUsernameOrEmail,
    forgotSubmitted,
    forgotLoading,
    handleForgotSubmit,
    handleBackToLogin,
    turnstileContainerRef,
    copy,
  } = form;

  const { turnstileSiteKey } = props;

  if (forgotSubmitted) {
    return (
      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center py-2">
        <div className="size-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-1">
          <Check className="size-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            {copy.checkInboxTitle}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed px-2">
            {copy.checkInboxDesc}
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs font-medium justify-center gap-1.5 border-border/80 bg-background/50 hover:bg-accent hover:text-foreground rounded-md transition-all cursor-pointer"
            onClick={handleBackToLogin}
          >
            <ArrowLeft className="size-3.5" />
            <span>{copy.backToSignIn}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Back to sign in button */}
      <div>
        <button
          type="button"
          onClick={handleBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>{copy.backToSignIn}</span>
        </button>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">
          {copy.forgotPasswordTitle}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {copy.forgotPasswordSubtitle}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleForgotSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label
            htmlFor="forgotEmailInput"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {copy.accountEmailOrUsername}
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="forgotEmailInput"
              name="forgotUsername"
              type="text"
              autoComplete="username"
              placeholder={copy.accountPlaceholder}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="pl-9 h-9 bg-black/90 dark:bg-black/90 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-black focus-visible:bg-black dark:focus:bg-black dark:focus-visible:bg-black focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-colors"
              disabled={forgotLoading}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Cloudflare Turnstile anti-bot widget container */}
        {Boolean(turnstileSiteKey?.trim()) && (
          <div className="flex flex-col items-center justify-center pt-1 min-h-[65px]">
            <div ref={turnstileContainerRef} className="cf-turnstile" />
          </div>
        )}

        <Button
          type="submit"
          size="sm"
          className="w-full h-8 text-xs font-semibold justify-center gap-1.5 rounded-md shadow-sm transition-all cursor-pointer"
          disabled={forgotLoading || !usernameOrEmail.trim()}
        >
          <span>{forgotLoading ? copy.sendingResetLink : copy.sendResetLink}</span>
        </Button>
      </form>
    </div>
  );
}
