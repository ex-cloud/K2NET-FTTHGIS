import React, { useState } from "react";
import { Server, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface OltConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function OltConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: OltConfigFormProps) {
  const [showOltKey, setShowOltKey] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Infrastructure Connections
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Koneksi database PostgreSQL dan Redis Queue untuk komunikasi OLT device workers.
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
            <Lock className="w-4 h-4 text-primary" /> Keamanan & Batas Koneksi OLT
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Kunci enkripsi AES-256 untuk kredensial OLT serta batasan waktu koneksi SNMP/SSH.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="OLT_ENCRYPTION_KEY" className="text-xs text-muted-foreground">OLT Encryption Master Key</Label>
              <button
                type="button"
                onClick={() => setShowOltKey(!showOltKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showOltKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showOltKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="OLT_ENCRYPTION_KEY"
              type={showOltKey ? "text" : "password"}
              value={config.OLT_ENCRYPTION_KEY || ""}
              onChange={(e) => onInputChange("OLT_ENCRYPTION_KEY", e.target.value)}
              placeholder="Master Key Baru..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="SNMP_TIMEOUT_SECONDS" className="text-xs text-muted-foreground">SNMP Timeout (Seconds)</Label>
              <Input
                id="SNMP_TIMEOUT_SECONDS"
                type="number"
                value={config.SNMP_TIMEOUT_SECONDS || ""}
                onChange={(e) => onInputChange("SNMP_TIMEOUT_SECONDS", e.target.value)}
                placeholder="5"
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="SSH_TIMEOUT_SECONDS" className="text-xs text-muted-foreground">SSH Timeout (Seconds)</Label>
              <Input
                id="SSH_TIMEOUT_SECONDS"
                type="number"
                value={config.SSH_TIMEOUT_SECONDS || ""}
                onChange={(e) => onInputChange("SSH_TIMEOUT_SECONDS", e.target.value)}
                placeholder="10"
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="MAX_CONCURRENT_OLT_CONNECTIONS" className="text-xs text-muted-foreground">Max Concurrent Connections</Label>
            <Input
              id="MAX_CONCURRENT_OLT_CONNECTIONS"
              type="number"
              value={config.MAX_CONCURRENT_OLT_CONNECTIONS || ""}
              onChange={(e) => onInputChange("MAX_CONCURRENT_OLT_CONNECTIONS", e.target.value)}
              placeholder="50"
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
          <ActionTooltip label="Simpan Konfigurasi OLT Gateway" shortcut="Ctrl+S">
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
