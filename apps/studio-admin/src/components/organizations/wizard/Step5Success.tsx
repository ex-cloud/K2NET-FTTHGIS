import * as React from "react";
import { Check, ExternalLink, Copy, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { toast } from "sonner";
import { getTenantUrl } from "@/lib/domain";

interface Step5SuccessProps {
  name: string;
  deployedData: {
    slug: string;
    adminPassword?: string;
    adminUsername?: string;
    adminEmail?: string;
    activationUrl?: string;
  };
  onCopyPassword: (text: string) => void;
  copied: boolean;
}

export function Step5Success({
  name,
  deployedData,
  onCopyPassword,
  copied,
}: Step5SuccessProps) {
  const { t } = useTranslation();
  const [magicLinkCopied, setMagicLinkCopied] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  const activationUrl =
    deployedData.activationUrl ||
    `https://${deployedData.slug}.kdua.net/activate`;

  const handleCopyMagicLink = async () => {
    try {
      await navigator.clipboard.writeText(activationUrl);
      setMagicLinkCopied(true);
      toast.success(t("organizations.wizard_step5_magic_link_copied"));
      setTimeout(() => setMagicLinkCopied(false), 2000);
    } catch {
      toast.error(t("organizations.wizard_step5_toast_resend_failed"));
    }
  };

  const handleResendEmail = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const res = await fetch(`/api/v1/organizations/${encodeURIComponent(deployedData.slug)}/activation-link/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success(
          t("organizations.wizard_step5_toast_resend_success", { email: deployedData.adminEmail || deployedData.adminUsername || "" })
        );
      } else {
        toast.error(t("organizations.wizard_step5_toast_resend_failed"));
      }
    } catch {
      toast.error(t("organizations.wizard_step5_toast_resend_failed"));
    } finally {
      setTimeout(() => setIsResending(false), 3000);
    }
  };

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-500 py-1">
      {/* Header Badge */}
      <div className="flex flex-col items-center text-center space-y-1">
        <div className="size-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-0.5 shadow-sm">
          <ShieldCheck className="size-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          {t("organizations.wizard_step5_title")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md">
          {t("organizations.wizard_step5_success_desc", { name })}
        </p>
      </div>

      {/* Dual Activation Option (Email Dispatch + Magic Link) */}
      <div className="p-3.5 rounded-xl bg-card border border-border space-y-3 shadow-xs">
        {/* Email Status Indicator */}
        <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="size-4 text-primary shrink-0" />
            <span className="text-foreground font-medium truncate">
              {t("organizations.wizard_step5_email_sent_to", {
                email: deployedData.adminEmail || deployedData.adminUsername || "admin",
              })}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/20 gap-1.5 shrink-0"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            <RefreshCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
            <span>{isResending ? t("organizations.wizard_step5_resending") : t("organizations.wizard_step5_resend_email")}</span>
          </Button>
        </div>

        {/* Portal URL */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
          <span className="text-muted-foreground font-mono text-[11px]">
            {t("organizations.wizard_step5_portal_url")}
          </span>
          <a
            href={getTenantUrl(deployedData.slug)}
            target="_blank"
            rel="noreferrer"
            className="text-primary font-bold font-mono flex items-center gap-1 hover:underline"
          >
            <span>{getTenantUrl(deployedData.slug)}</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Admin Identity */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2 text-xs">
          <span className="text-muted-foreground font-mono text-[11px]">
            {t("organizations.wizard_step5_admin_username")}
          </span>
          <span className="font-mono font-bold text-foreground">
            {deployedData.adminUsername}
          </span>
        </div>

        {/* Direct Magic Link Copy Button */}
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono text-[11px]">MAGIC ACTIVATION LINK</span>
            <span className="text-[10px] text-primary font-mono">1-Click WhatsApp Onboarding</span>
          </div>
          <div className="flex items-center justify-between bg-background border border-border rounded-lg p-2 gap-2">
            <span className="text-muted-foreground font-mono text-xs truncate max-w-sm">
              {activationUrl}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs font-medium gap-1 text-foreground hover:text-primary shrink-0"
              onClick={handleCopyMagicLink}
            >
              {magicLinkCopied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
              <span>{magicLinkCopied ? t("organizations.wizard_step5_copied") : t("organizations.wizard_step5_copy_magic_link")}</span>
            </Button>
          </div>
        </div>

        {/* Temporary Initial Password Card */}
        {deployedData.adminPassword && (
          <div className="space-y-1 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono text-[11px]">
                {t("organizations.wizard_step5_initial_password")}
              </span>
              <span className="text-[10px] text-amber-500 font-mono">
                {t("organizations.wizard_step5_shown_once")}
              </span>
            </div>
            <div className="flex items-center justify-between bg-background border border-border rounded-lg p-2 gap-2">
              <code className="text-primary font-mono text-xs font-bold truncate">
                {deployedData.adminPassword}
              </code>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-primary gap-1 shrink-0"
                onClick={() => onCopyPassword(deployedData.adminPassword || "")}
              >
                {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                <span>{copied ? t("organizations.wizard_step5_copied") : t("organizations.wizard_step5_copy")}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/80 text-center px-4">
        {t("organizations.wizard_step5_dual_activation_hint")}
      </p>
    </div>
  );
}
