import React, { useState } from "react";
import { Lock, Server, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface PaymentConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function PaymentConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: PaymentConfigFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookKey, setShowWebhookKey] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* Xendit Keys */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Kredensial Provider Xendit
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Kredensial API Key dan Token Webhook dari Dashboard Xendit untuk memvalidasi callback pembayaran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="XENDIT_API_KEY" className="text-xs text-muted-foreground">Xendit Secret API Key</Label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showApiKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="XENDIT_API_KEY"
              type={showApiKey ? "text" : "password"}
              value={config.XENDIT_API_KEY || ""}
              onChange={(e) => onInputChange("XENDIT_API_KEY", e.target.value)}
              placeholder="xnd_development_xxxxxxxxxxxxxxxxxxxxxx"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="XENDIT_WEBHOOK_KEY" className="text-xs text-muted-foreground">Xendit Webhook Verification Key</Label>
              <button
                type="button"
                onClick={() => setShowWebhookKey(!showWebhookKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showWebhookKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showWebhookKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="XENDIT_WEBHOOK_KEY"
              type={showWebhookKey ? "text" : "password"}
              value={config.XENDIT_WEBHOOK_KEY || ""}
              onChange={(e) => onInputChange("XENDIT_WEBHOOK_KEY", e.target.value)}
              placeholder="Webhook Verification Token..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Core System Integration */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Integrasi Core System
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Endpoint API Core System (Spring Boot) yang digunakan untuk sinkronisasi status tagihan setelah pembayaran sukses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="CORE_API_URL" className="text-xs text-muted-foreground">Core System Base URL</Label>
            <Input
              id="CORE_API_URL"
              type="text"
              value={config.CORE_API_URL || ""}
              onChange={(e) => onInputChange("CORE_API_URL", e.target.value)}
              placeholder="http://127.0.0.1:9090"
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
          <ActionTooltip label="Simpan Konfigurasi Payment Gateway" shortcut="Ctrl+S">
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
