import * as React from "react";
import { Key, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Badge, Input, Button } from "@k2net/ui";
import type { WizardFormData } from "./types";

interface Step4AdminFormProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  isSubmitting?: boolean;
  slugError?: string | null;
  onRegenerateRandomSlug?: () => void;
}

export function Step4AdminForm({
  formData,
  setFormData,
  isSubmitting = false,
  slugError,
  onRegenerateRandomSlug,
}: Step4AdminFormProps) {
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
