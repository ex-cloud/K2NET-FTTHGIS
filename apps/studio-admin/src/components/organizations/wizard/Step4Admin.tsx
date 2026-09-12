import * as React from "react";
import { Key, ShieldCheck, CheckCircle2, Loader2, Circle, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { Badge, Input, Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { PROVISIONING_STAGES, type WizardFormData, type ProvisioningStageInfo } from "./types";

interface Step4AdminProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  isSubmitting?: boolean;
  provisioningStage?: number;
  provisioningStages?: ProvisioningStageInfo[];
  slugError?: string | null;
  onRegenerateRandomSlug?: () => void;
}

export function Step4Admin({
  formData,
  setFormData,
  isSubmitting = false,
  provisioningStage = 1,
  provisioningStages = PROVISIONING_STAGES,
  slugError,
  onRegenerateRandomSlug,
}: Step4AdminProps) {
  // If provisioning is actively running, show the dedicated Live Provisioning Progress Card
  if (isSubmitting) {
    const progressPercent = Math.min(100, Math.max(15, (provisioningStage / 5) * 100));

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="rounded-xl border border-primary/30 bg-card/90 p-5 space-y-4 shadow-lg backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Loader2 className="size-4 animate-spin" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>Menerapkan Organisasi & Infrastruktur</span>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[9px]">
                    LIVE
                  </Badge>
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Menyiapkan database terisolasi, realm Keycloak 26, dan akun PIC...
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-primary">{Math.round(progressPercent)}%</span>
          </div>

          {/* Progress Track */}
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-primary h-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stage List */}
          <div className="space-y-2 pt-1">
            {provisioningStages.map((stage) => {
              const isCompleted = stage.id < provisioningStage;
              const isCurrent = stage.id === provisioningStage;
              const isPending = stage.id > provisioningStage;

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-300",
                    isCurrent && "border-primary/40 bg-primary/5 shadow-xs",
                    isCompleted && "border-border/60 bg-muted/20",
                    isPending && "border-transparent opacity-40"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted && <CheckCircle2 className="size-4 text-primary" />}
                    {isCurrent && <Loader2 className="size-4 animate-spin text-primary" />}
                    {isPending && <Circle className="size-4 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "text-xs font-semibold leading-tight",
                          isCurrent ? "text-foreground font-bold" : isCompleted ? "text-foreground/85" : "text-muted-foreground"
                        )}
                      >
                        {stage.label}
                      </p>
                      {isCompleted && (
                        <span className="text-[10px] text-primary font-mono font-medium">Selesai</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] text-primary font-mono font-medium animate-pulse">Memproses...</span>
                      )}
                    </div>
                    {(isCurrent || isCompleted) && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{stage.detail}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Safe Lock Warning */}
          <div className="rounded-lg bg-muted/50 border border-border p-2.5 text-[10px] text-muted-foreground flex items-center gap-2">
            <Layers className="size-3.5 text-primary shrink-0" />
            <span>
              Proses provisi keamanan Keycloak membutuhkan waktu sekitar <strong>15 detik</strong>. Mohon tidak menutup jendela ini.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="rounded-xl border border-border/80 bg-card/80 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Technical PIC & Initial Super Admin</span>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
            ROLE_TENANT_ADMIN
          </Badge>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Technical PIC Full Name</label>
            <Input
              value={formData.picName}
              disabled={isSubmitting}
              onChange={(e) => setFormData((prev) => ({ ...prev, picName: e.target.value }))}
              placeholder="e.g. Ahmad Fauzi (NOC Lead)"
              className="bg-background border-border text-xs h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Admin Email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={formData.adminEmail}
                disabled={isSubmitting}
                onChange={(e) => setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))}
                placeholder="admin@nusantara.net"
                className="bg-background border-border text-xs h-8 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Admin Username</label>
              <Input
                value={formData.adminUsername}
                disabled={isSubmitting}
                onChange={(e) => setFormData((prev) => ({ ...prev, adminUsername: e.target.value }))}
                placeholder="admin_nusantara"
                className="bg-background border-border text-xs h-8 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keycloak Realm Scoping Card */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-primary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <span>Isolated Keycloak 26 Realm Architecture</span>
          </div>
          <span className="font-mono text-[10px] uppercase font-bold">Scoped</span>
        </div>
        <div className="text-[11px] text-muted-foreground space-y-1 font-mono">
          <div className="flex justify-between items-center">
            <span>Target Realm:</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-foreground font-bold">
                {formData.slug ? `${formData.slug}-realm` : "tenant-realm"}
              </strong>
              {formData.slugMode === "random" && onRegenerateRandomSlug && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerateRandomSlug}
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                  title="Acak ulang subdomain & realm"
                >
                  <RefreshCw className="size-2.5" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span>PostGIS Schema:</span>
            <strong className="text-foreground font-bold">
              tenant_{formData.slug || "schema"}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>MinIO S3 Bucket:</span>
            <strong className="text-foreground font-bold">
              tenant-{formData.slug || "bucket"}
            </strong>
          </div>
        </div>
      </div>

      {slugError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Peringatan Subdomain</p>
            <p className="text-[11px] opacity-90">{slugError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

