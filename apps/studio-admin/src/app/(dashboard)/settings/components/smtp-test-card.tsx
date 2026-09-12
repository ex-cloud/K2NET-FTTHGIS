import { Button } from "@k2net/ui";
import { Play, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

interface SmtpTestCardProps {
  onTest: () => void;
  isTestingEmail: boolean;
  smtpTestResult: { success: boolean; message: string } | null;
}

export function SmtpTestCard({ onTest, isTestingEmail, smtpTestResult }: SmtpTestCardProps) {
  return (
    <div className="bg-muted/10 border border-dashed border-border/80 p-6 rounded-xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" /> Interactive Connection Test
          </h3>
          <p className="text-xs text-muted-foreground">
            Uji konektivitas pengaturan SMTP secara langsung dengan menghubungkan socket ke host server SMTP.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onTest}
          disabled={isTestingEmail}
          className="border-border hover:bg-muted text-muted-foreground text-xs h-9 px-4 gap-2 shrink-0"
        >
          {isTestingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          Run Connection Test
        </Button>
      </div>

      {/* Diagnostic Output Console */}
      {smtpTestResult && (
        <div
          className={`p-4 rounded-lg border text-xs font-mono flex items-start gap-3 transition-all ${
            smtpTestResult.success
              ? "bg-primary/10 text-primary/80 border-primary/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {smtpTestResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-primary/80 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {smtpTestResult.success ? "CONNECTION SUCCESSFUL" : "CONNECTION FAILED"}
            </p>
            <p className="opacity-90">{smtpTestResult.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
