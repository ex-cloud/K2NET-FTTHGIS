import React from "react";
import { Server, Lock, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface SchedulerConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function SchedulerConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: SchedulerConfigFormProps) {
  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Infrastructure Connections
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Koneksi database dan antrean broker Redis untuk scheduler gateway.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="REDIS_ADDR" className="text-xs text-muted-foreground">Redis Address</Label>
            <Input
              id="REDIS_ADDR"
              type="text"
              value={config.REDIS_ADDR || ""}
              onChange={(e) => onInputChange("REDIS_ADDR", e.target.value)}
              placeholder="redis:6379"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="DATABASE_URL" className="text-xs text-muted-foreground">Database Connection URL</Label>
            <Input
              id="DATABASE_URL"
              type="text"
              value={config.DATABASE_URL || ""}
              onChange={(e) => onInputChange("DATABASE_URL", e.target.value)}
              placeholder="postgres://..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Worker Settings
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Konfigurasi batasan beban eksekusi job dan zona waktu server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="TIMEZONE" className="text-xs text-muted-foreground">Timezone</Label>
            <Input
              id="TIMEZONE"
              type="text"
              value={config.TIMEZONE || ""}
              onChange={(e) => onInputChange("TIMEZONE", e.target.value)}
              placeholder="Asia/Jakarta"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="MAX_CONCURRENT_JOBS" className="text-xs text-muted-foreground">Max Concurrent Jobs</Label>
            <Input
              id="MAX_CONCURRENT_JOBS"
              type="number"
              value={config.MAX_CONCURRENT_JOBS || ""}
              onChange={(e) => onInputChange("MAX_CONCURRENT_JOBS", e.target.value)}
              placeholder="10"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <ActionTooltip label="Kembalikan Nilai Form" shortcut="Alt+R">
          <Button
            type="button"
            onClick={onReset}
            variant="outline"
            className="border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent text-xs h-9 px-4"
          >
            Reset Form
          </Button>
        </ActionTooltip>
        <PermissionGuard permission="system.gateway.manage">
          <ActionTooltip label="Simpan Konfigurasi Scheduler Gateway" shortcut="Ctrl+S">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-5 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Configuration
            </Button>
          </ActionTooltip>
        </PermissionGuard>
      </div>
    </form>
  );
}
