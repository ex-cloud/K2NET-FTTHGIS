import * as React from "react";
import { ShieldAlert, ExternalLink, XCircle } from "lucide-react";
import { Button } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";

interface ActiveImpersonationBannerProps {
  activeSession: {
    hasActiveSession: boolean;
    remainingSeconds?: number;
    targetOrgName?: string;
    targetOrgSlug?: string;
  } | null;
  terminating: boolean;
  onReopenPortal: (slug: string) => void;
  onStopSession: () => void;
}

export function ActiveImpersonationBanner({
  activeSession,
  terminating,
  onReopenPortal,
  onStopSession,
}: ActiveImpersonationBannerProps) {
  const { t } = useTranslation();

  if (!activeSession?.hasActiveSession || (activeSession?.remainingSeconds ?? 0) <= 0) {
    return null;
  }

  return (
    <div className="mx-4 md:mx-6 mt-4 mb-2 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <ShieldAlert className="h-4 w-4 animate-pulse" />
        </div>
        <div className="space-y-0.5 text-xs">
          <div className="font-bold flex items-center gap-1.5 text-foreground">
            <span>{t("security.impersonation_active_title")}:</span>
            <span className="font-mono text-primary underline">{activeSession.targetOrgName}</span>
            <span className="text-[10px] font-mono text-muted-foreground">({activeSession.targetOrgSlug})</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("security.impersonation_active_desc")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReopenPortal(activeSession.targetOrgSlug!)}
          className="h-8 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
        >
          <span>{t("organizations.open_portal")}</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onStopSession}
          disabled={terminating}
          className="h-8 text-xs font-medium gap-1.5"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>{terminating ? t("common.processing") : t("security.end_session_btn")}</span>
        </Button>
      </div>
    </div>
  );
}
