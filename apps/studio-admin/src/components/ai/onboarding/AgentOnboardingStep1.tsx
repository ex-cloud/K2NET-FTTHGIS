import { 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  ArrowRight 
} from "lucide-react";
import { 
  Button, 
  Badge 
} from "@k2net/ui";

export interface Step1Props {
  scope: string;
  currentAccountName: string;
  grantAllAccounts: boolean;
  setGrantAllAccounts: (val: boolean) => void;
  loading: boolean;
  onNext: () => void;
  onClose?: () => void;
}

export function AgentOnboardingStep1({
  scope,
  currentAccountName,
  grantAllAccounts,
  setGrantAllAccounts,
  loading,
  onNext,
  onClose,
}: Step1Props) {
  return (
    <div className="p-6 md:p-8 space-y-6 flex flex-col items-center text-center">
      <div className="relative mt-2">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/30 via-primary/15 to-amber-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-background border border-border flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Enable K2 Agent access
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Token API aman akan dibuat untuk mengizinkan K2 Agent mengakses sumber daya {scope === "PLATFORM_INTERNAL" ? "platform internal K2NET" : "operasional tenant Anda"}.
        </p>
      </div>

      <div className="w-full text-left p-4 rounded-xl bg-background border border-border space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div>
            <p className="text-xs font-semibold text-foreground">
              {scope === "PLATFORM_INTERNAL" ? "Akses Seluruh Modul Internal" : "Akses Seluruh Modul Tenant"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Termasuk modul baru yang ditambahkan di masa mendatang
            </p>
          </div>
          <input
            type="checkbox"
            checked={grantAllAccounts}
            onChange={(e) => setGrantAllAccounts(e.target.checked)}
            className="rounded border-border text-primary focus:ring-0 cursor-pointer h-4 w-4"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-foreground/75 dark:text-muted-foreground mb-1.5">
            <span>Pilih Workspace / Akun:</span>
            <span className="font-mono text-primary text-[10px]">1 terpilih</span>
          </div>
          
          <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="rounded border-primary text-primary focus:ring-0 h-4 w-4"
              />
              <div>
                <p className="text-xs font-bold text-foreground">{currentAccountName}</p>
                <p className="text-[10px] font-mono text-muted-foreground">Scope: {scope}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-primary/30 text-primary bg-primary/10">
              Current
            </Badge>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2 pt-2">
        <Button
          onClick={onNext}
          disabled={loading}
          className="w-full text-xs font-bold h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Review permissions</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer pt-1"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
}
