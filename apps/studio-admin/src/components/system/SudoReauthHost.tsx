import * as React from "react";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import {
  useAuth,
  registerSudoHandler,
  fetchSudoStatus,
  fetchSudoWebauthnChallenge,
  sendSudoEmailOtp,
  verifySudoChallenge,
  emitSudoStatusChange,
  type SudoChallengeRequest,
  type SudoStatusResponse,
} from "@k2net/auth/client";
import { SudoReauthModal, type SudoReauthLabels, type SudoVerifySubmitPayload } from "@k2net/ui";

export function SudoReauthHost() {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [open, setOpen] = React.useState(false);
  const [requestInfo, setRequestInfo] = React.useState<SudoChallengeRequest>({});
  const [status, setStatus] = React.useState<SudoStatusResponse | null>(null);
  const resolverRef = React.useRef<((ok: boolean) => void) | null>(null);

  const getToken = React.useCallback(() => {
    if (token) return token;
    if (typeof window !== "undefined") {
      const bridge = (window as unknown as { __K2NET_AUTH__?: { token?: string } }).__K2NET_AUTH__;
      if (bridge?.token) return bridge.token;
    }
    return null;
  }, [token]);

  React.useEffect(() => {
    return registerSudoHandler((req) => {
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setRequestInfo(req);
        setStatus(null);
        setOpen(true);
        void fetchSudoStatus(getToken()).then((fetched) => {
          if (fetched) {
            setStatus(fetched);
          } else {
            setStatus({
              elevated: false,
              sudoActive: false,
              freshLoginActive: false,
              isBreakGlass: Boolean(req.isBreakGlass),
              source: "none",
              remainingSeconds: 0,
              availableMethods: ["totp", "email_otp", "password"],
            });
          }
        });
      });
    });
  }, [getToken]);

  const labels: SudoReauthLabels = React.useMemo(
    () => ({
      title: t("auth.sudo.title"),
      subtitleAction: t("auth.sudo.subtitle_action"),
      subtitleBreakGlass: t("auth.sudo.subtitle_break_glass"),
      subtitleDefault: t("auth.sudo.subtitle_default"),
      methodLabel: t("auth.sudo.method_label"),
      methodWebauthn: t("auth.sudo.method_webauthn"),
      methodTotp: t("auth.sudo.method_totp"),
      methodEmailOtp: t("auth.sudo.method_email_otp"),
      methodBackupCode: t("auth.sudo.method_backup_code"),
      methodPassword: t("auth.sudo.method_password"),
      passkeyPromptDesc: t("auth.sudo.passkey_prompt_desc"),
      passkeyVerifyBtn: t("auth.sudo.passkey_verify_btn"),
      passkeyVerifying: t("auth.sudo.passkey_verifying"),
      passkeyCancelled: t("auth.sudo.passkey_cancelled"),
      passkeyUnsupported: t("auth.sudo.passkey_unsupported"),
      totpPromptDesc: t("auth.sudo.totp_prompt_desc"),
      totpPlaceholder: t("auth.sudo.totp_placeholder"),
      emailOtpSendBtn: t("auth.sudo.email_otp_send_btn"),
      emailOtpResendIn: t("auth.sudo.email_otp_resend_in"),
      emailOtpSentHint: t("auth.sudo.email_otp_sent_hint"),
      emailOtpPlaceholder: t("auth.sudo.email_otp_placeholder"),
      backupCodePromptDesc: t("auth.sudo.backup_code_prompt_desc"),
      backupCodePlaceholder: t("auth.sudo.backup_code_placeholder"),
      passwordPromptDesc: t("auth.sudo.password_prompt_desc"),
      passwordPlaceholder: t("auth.sudo.password_placeholder"),
      verifyBtn: t("auth.sudo.verify_btn"),
      verifyingBtn: t("auth.sudo.verifying_btn"),
      cancelBtn: t("auth.sudo.cancel_btn"),
      attemptsRemaining: t("auth.sudo.attempts_remaining"),
      rateLimited: t("auth.sudo.rate_limited"),
    }),
    [t]
  );

  const settle = (ok: boolean) => {
    const fn = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    if (fn) fn(ok);
  };

  return (
    <SudoReauthModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          settle(false);
        }
      }}
      status={status}
      actionName={requestInfo.action}
      isBreakGlass={requestInfo.isBreakGlass}
      labels={labels}
      onGetWebauthnChallenge={() => fetchSudoWebauthnChallenge(getToken())}
      onSendEmailOtp={() => sendSudoEmailOtp(getToken())}
      onVerify={async (payload: SudoVerifySubmitPayload) => {
        const res = await verifySudoChallenge(getToken(), payload);
        if (res.ok) {
          const freshStatus = await fetchSudoStatus(getToken());
          if (freshStatus) {
            emitSudoStatusChange(freshStatus);
          } else {
            emitSudoStatusChange({
              elevated: true,
              sudoActive: true,
              freshLoginActive: false,
              isBreakGlass: Boolean(res.isBreakGlass ?? requestInfo.isBreakGlass),
              source: "sudo",
              remainingSeconds: res.remainingSeconds ?? 900,
              expiresAt: res.expiresAt,
              availableMethods: status?.availableMethods || ["totp"],
              maskedEmail: status?.maskedEmail,
            });
          }
        }
        return res;
      }}
      onSuccess={() => {
        toast.success(t("auth.sudo.unlocked_toast"));
        settle(true);
      }}
      onCancel={() => {
        settle(false);
      }}
    />
  );
}
