import React, { useState } from "react";
import { Cloud, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface StorageConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function StorageConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: StorageConfigFormProps) {
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* S3/R2 Bucket Connection Details */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" /> Koneksi Bucket S3 / Cloudflare R2
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Konfigurasi parameter region, custom API endpoint, dan nama bucket untuk menyimpan berkas media.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="AWS_REGION" className="text-xs text-muted-foreground">AWS / R2 Region</Label>
              <Input
                id="AWS_REGION"
                type="text"
                value={config.AWS_REGION || ""}
                onChange={(e) => onInputChange("AWS_REGION", e.target.value)}
                placeholder="auto / ap-southeast-1"
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="AWS_BUCKET_NAME" className="text-xs text-muted-foreground">Bucket Name</Label>
              <Input
                id="AWS_BUCKET_NAME"
                type="text"
                value={config.AWS_BUCKET_NAME || ""}
                onChange={(e) => onInputChange("AWS_BUCKET_NAME", e.target.value)}
                placeholder="my-bucket-name"
                className="bg-input border-border text-foreground text-xs focus:border-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="AWS_ENDPOINT" className="text-xs text-muted-foreground">Custom S3 Endpoint (Cloudflare R2/MinIO URL)</Label>
            <Input
              id="AWS_ENDPOINT"
              type="text"
              value={config.AWS_ENDPOINT || ""}
              onChange={(e) => onInputChange("AWS_ENDPOINT", e.target.value)}
              placeholder="https://<account-id>.r2.cloudflarestorage.com"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* AWS / R2 Credentials */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> AWS Credentials / Access Keys
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Kunci akses aman yang digunakan untuk memberikan otorisasi penulisan/pengunggahan file ke bucket S3.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="AWS_ACCESS_KEY_ID" className="text-xs text-muted-foreground">Access Key ID</Label>
              <button
                type="button"
                onClick={() => setShowAccessKey(!showAccessKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showAccessKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAccessKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="AWS_ACCESS_KEY_ID"
              type={showAccessKey ? "text" : "password"}
              value={config.AWS_ACCESS_KEY_ID || ""}
              onChange={(e) => onInputChange("AWS_ACCESS_KEY_ID", e.target.value)}
              placeholder="Access Key ID Baru..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="AWS_SECRET_ACCESS_KEY" className="text-xs text-muted-foreground">Secret Access Key</Label>
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecretKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="AWS_SECRET_ACCESS_KEY"
              type={showSecretKey ? "text" : "password"}
              value={config.AWS_SECRET_ACCESS_KEY || ""}
              onChange={(e) => onInputChange("AWS_SECRET_ACCESS_KEY", e.target.value)}
              placeholder="Secret Access Key Baru..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
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
          <ActionTooltip label="Simpan Konfigurasi Storage Gateway" shortcut="Ctrl+S">
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
