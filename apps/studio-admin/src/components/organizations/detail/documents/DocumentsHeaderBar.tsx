import { Badge, Button } from "@k2net/ui";
import { ShieldCheck, CheckCircle2, Upload } from "lucide-react";

interface DocumentsHeaderBarProps {
  onOpenUpload: () => void;
}

export function DocumentsHeaderBar({ onOpenUpload }: DocumentsHeaderBarProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start md:items-center gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">B2B Compliance &amp; KYC Verification Status</h3>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] gap-1 px-2 py-0.5">
              <CheckCircle2 className="h-3 w-3" />
              <span>KYC VERIFIED</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Dokumen legalitas badan hukum, perizinan ISP Kominfo, dan kontak penanggung jawab terverifikasi valid.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={onOpenUpload}
          className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Document</span>
        </Button>
      </div>
    </div>
  );
}
