import { Badge, Button } from "@k2net/ui";
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, Upload } from "lucide-react";
import { useTranslation } from "@k2net/i18n";
import { cn } from "@/lib/utils";

interface DocumentsHeaderBarProps {
  onOpenUpload: () => void;
  kycSummary: {
    totalDocs: number;
    verifiedCount: number;
    pendingCount: number;
    revisionCount: number;
    completionPercent: number;
    overallKycStatus: "VERIFIED" | "PENDING" | "REVISION" | "INCOMPLETE";
  };
}

export function DocumentsHeaderBar({ onOpenUpload, kycSummary }: DocumentsHeaderBarProps) {
  const { t } = useTranslation();
  const { totalDocs, verifiedCount, pendingCount, revisionCount, completionPercent, overallKycStatus } = kycSummary;

  return (
    <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
        <div
          className={cn(
            "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs",
            overallKycStatus === "VERIFIED" && "bg-primary/10 border-primary/20 text-primary",
            overallKycStatus === "PENDING" && "bg-amber-500/10 border-amber-500/20 text-amber-500",
            overallKycStatus === "REVISION" && "bg-destructive/10 border-destructive/20 text-destructive",
            overallKycStatus === "INCOMPLETE" && "bg-muted/60 border-border text-muted-foreground"
          )}
        >
          {overallKycStatus === "VERIFIED" ? (
            <ShieldCheck className="h-5 w-5" />
          ) : overallKycStatus === "REVISION" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">
              {t("organizations.doc_kyc_header_title")}
            </h3>
            {overallKycStatus === "VERIFIED" && (
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" />
                <span>{t("organizations.doc_kyc_fully_verified")}</span>
              </Badge>
            )}
            {overallKycStatus === "PENDING" && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 font-mono text-[10px] gap-1 px-2 py-0.5">
                <Clock className="h-3 w-3" />
                <span>{t("organizations.doc_kyc_pending_review", { count: pendingCount })}</span>
              </Badge>
            )}
            {overallKycStatus === "REVISION" && (
              <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive font-mono text-[10px] gap-1 px-2 py-0.5">
                <AlertTriangle className="h-3 w-3" />
                <span>{t("organizations.doc_kyc_needs_revision", { count: revisionCount })}</span>
              </Badge>
            )}
            {overallKycStatus === "INCOMPLETE" && (
              <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px] px-2 py-0.5">
                {t("organizations.doc_kyc_incomplete")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>
              {t("organizations.doc_kyc_verification_progress", {
                verified: verifiedCount,
                total: totalDocs,
                pct: completionPercent,
              })}
            </span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border/40 inline-flex">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  overallKycStatus === "VERIFIED" ? "bg-primary" : "bg-amber-500"
                )}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={onOpenUpload}
          className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{t("organizations.doc_upload_btn")}</span>
        </Button>
      </div>
    </div>
  );
}
