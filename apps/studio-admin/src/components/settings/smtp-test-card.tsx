import { Button } from "@k2net/ui";
import { Play, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { useTranslation } from "@k2net/i18n";

export interface SmtpTestCardProps {
  onTest: () => void;
  isTestingEmail: boolean;
  smtpTestResult: { success: boolean; message: string } | null;
}

export function SmtpTestCard({ onTest, isTestingEmail, smtpTestResult }: SmtpTestCardProps) {
  const { t } = useTranslation();

  return (
    <SettingsSection
      title={t("settings.smtp.test_card_title")}
      description={t("settings.smtp.test_card_desc")}
      divider={false}
      cardClassName="bg-muted/10 border-dashed border-border/80 p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-primary" />
            <span>{t("settings.smtp.run_test_btn")}</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("settings.smtp.test_card_desc")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={isTestingEmail}
          className="border-border hover:bg-muted text-foreground text-xs h-7 px-2.5 gap-1.5 shrink-0 rounded-md shadow-xs cursor-pointer"
        >
          {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {t("settings.smtp.run_test_btn")}
        </Button>
      </div>

      {/* Diagnostic Output Console */}
      {smtpTestResult && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 transition-all ${
            smtpTestResult.success
              ? "bg-primary/10 text-primary/90 border-primary/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {smtpTestResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 min-w-0">
            <p className="font-semibold">
              {smtpTestResult.success ? "CONNECTION SUCCESSFUL" : "CONNECTION FAILED"}
            </p>
            <p className="opacity-90 break-words">{smtpTestResult.message}</p>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
