import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button, Badge } from "@k2net/ui";

interface ImpersonationCenterHeaderProps {
  canForceRevoke: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export function ImpersonationCenterHeader({
  canForceRevoke,
  loading,
  onRefresh,
}: ImpersonationCenterHeaderProps) {
  return (
    <div className="border-b border-border/80 bg-card/60 backdrop-blur-xs px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">
                Support Access &amp; Impersonation Center
              </h1>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-mono uppercase">
                {canForceRevoke ? "God Mode Audit & Revoke" : "Read-Only Auditor Mode"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Pusat pengawasan forensik dan kontrol akses operasional darurat Super Admin ke portal tenant.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 text-xs font-semibold gap-1.5 border-border cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan Data</span>
        </Button>
      </div>
    </div>
  );
}
