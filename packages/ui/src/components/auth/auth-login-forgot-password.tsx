import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Mail, RefreshCw } from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { cn } from "../../utils";
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

  // 60-second cooldown timer for resending forgot password instructions
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (!forgotSubmitted) return;
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [forgotSubmitted]);

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cooldown > 0 || forgotLoading) return;
    setCooldown(60);
    handleForgotSubmit(e as unknown as React.FormEvent);
  };

  if (forgotSubmitted) {
    return (
      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center py-2">
        <div className="size-12 rounded-full bg-muted border border-border flex items-center justify-center text-foreground mx-auto mb-1">
          <Check className="size-6 text-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">
            {copy.checkInboxTitle}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed px-2">
            {copy.checkInboxDesc}
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={cooldown > 0 || forgotLoading}
            className="w-full h-7 px-2.5 text-xs font-medium justify-center gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
            onClick={handleResend}
          >
            <RefreshCw className={cn("size-3", forgotLoading && "animate-spin")} />
            <span>
              {cooldown > 0
                ? (copy.resendCooldown || "Resend available in {seconds}s").replace("{seconds}", String(cooldown))
                : (copy.resendInstructions || "Resend instructions")}
            </span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full h-7 px-2.5 text-xs font-medium justify-center gap-1.5 border-border/80 bg-background/50 hover:bg-accent hover:text-foreground rounded-md transition-all cursor-pointer"
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
              className="pl-9 h-9 bg-background/80 border-border/70 rounded-md text-xs sm:text-sm text-foreground focus:bg-background focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-foreground/50 transition-colors [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]"
              disabled={forgotLoading}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Cloudflare Turnstile anti-bot widget container (Full-width aligned with input & submit button) */}
        {Boolean(turnstileSiteKey?.trim()) && (
          <div className="pt-1">
            <div ref={turnstileContainerRef} className="min-h-[65px] w-full overflow-hidden rounded-md" />
          </div>
        )}

        <Button
          type="submit"
          size="sm"
          className="w-full h-8 font-medium text-xs justify-center gap-1.5 rounded-md shadow-xs transition-all cursor-pointer"
          disabled={forgotLoading || !usernameOrEmail.trim()}
        >
          <span>{forgotLoading ? copy.sendingResetLink : copy.sendResetLink}</span>
        </Button>
      </form>
    </div>
  );
}
