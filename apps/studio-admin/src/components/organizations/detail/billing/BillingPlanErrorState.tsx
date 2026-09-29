import * as React from "react";
import { Button } from "@k2net/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface BillingPlanErrorStateProps {
  onRetry?: () => void;
}

export function BillingPlanErrorState({ onRetry }: BillingPlanErrorStateProps) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3 my-4">
      <div className="flex justify-center">
        <div className="p-3 rounded-full bg-amber-500/20 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>
      <div className="space-y-1">
        <h5 className="text-sm font-semibold text-foreground">Gagal memuat paket dari server</h5>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Terjadi kendala saat menghubungkan ke database paket langganan. Silakan coba muat ulang data paket.
        </p>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="text-xs border-amber-500/40 bg-card hover:bg-amber-500/20 text-foreground font-medium gap-1.5 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Coba Lagi</span>
        </Button>
      )}
    </div>
  );
}
