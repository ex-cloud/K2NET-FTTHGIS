import * as React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Button, Card } from "@k2net/ui";
import { Link } from "@tanstack/react-router";

export interface TenantAccessDeniedProps {
  title?: string;
  description?: string;
  requiredPermission?: string | string[];
}

export function TenantAccessDenied({
  title = "Akses Dibatasi",
  description = "Akun Anda tidak memiliki izin PBAC yang cukup untuk membuka modul ini. Hubungi Owner atau Administrator Organisasi Anda.",
  requiredPermission,
}: TenantAccessDeniedProps) {
  const permLabel = Array.isArray(requiredPermission)
    ? requiredPermission.join(", ")
    : requiredPermission;

  return (
    <div className="flex-1 w-full h-full min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-6 text-center space-y-4 border-border/80 bg-card/90 shadow-lg backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mx-auto">
          <Shield className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {permLabel && (
          <div className="py-1 px-2.5 rounded-md bg-muted/40 border border-border/60 text-[11px] font-mono text-muted-foreground inline-block">
            Izin yang dibutuhkan: <span className="text-primary font-bold">{permLabel}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
            <Link to="/projects">
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Daftar Proyek
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
