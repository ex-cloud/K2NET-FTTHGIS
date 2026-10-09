import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  toast,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import { Copy, Download, FileText, Check } from "lucide-react";
import { useSession } from "@/lib/auth-compat";
import {
  fetchOfflineLicenseCertificate,
  type LicenseItem,
} from "@/hooks/useOrganizationLicenses";

interface OfflineCertExportModalProps {
  license: LicenseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfflineCertExportModal({
  license,
  open,
  onOpenChange,
}: OfflineCertExportModalProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [certContent, setCertContent] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open && license) {
      setLoading(true);
      fetchOfflineLicenseCertificate(
        license.organizationId,
        license.id,
        session?.accessToken ?? undefined
      )
        .then((content) => {
          setCertContent(content);
        })
        .catch((err) => {
          toast.error(err?.message || t("license.feedback.error_generic"));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setCertContent("");
      setCopied(false);
    }
  }, [open, license, session?.accessToken, t]);

  const handleCopy = () => {
    if (!certContent) return;
    navigator.clipboard.writeText(certContent).then(() => {
      setCopied(true);
      toast.success(t("license.actions.copied"));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!certContent || !license) return;
    const blob = new Blob([certContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `k2net-license-${license.organizationSlug || license.id.substring(0, 8)}.lic`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-foreground" />
            <DialogTitle className="text-base font-semibold text-foreground">
              {t("license.modal.export_title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {t("license.modal.export_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {license && (
            <div className="rounded-md border border-border/70 p-2.5 bg-muted/15 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("license.table.tenant_org")}:</span>
                <span className="font-medium text-foreground">{license.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("license.table.license_key")}:</span>
                <span className="font-mono text-foreground">{license.maskedLicenseKey}</span>
              </div>
            </div>
          )}

          <div className="relative">
            <pre className="h-48 overflow-y-auto p-3 rounded-md bg-muted/30 border border-border/80 font-mono text-[10px] text-foreground select-all leading-relaxed whitespace-pre-wrap">
              {loading ? t("common.processing") : certContent}
            </pre>
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            {t("license.modal.cert_instructions")}
          </p>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={loading || !certContent}
            className="gap-1.5"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {t("license.actions.copy_key")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={loading || !certContent}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            {t("license.actions.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
