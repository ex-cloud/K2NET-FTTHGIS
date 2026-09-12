import React, { useState } from "react";
import { Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface WhatsappConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function WhatsappConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: WhatsappConfigFormProps) {
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> WhatsApp Cloud API Credentials
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Kredensial resmi dari Meta Developer Console untuk modul pengiriman WhatsApp API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="WA_API_URL" className="text-xs text-muted-foreground">WhatsApp API URL Base</Label>
            <Input
              id="WA_API_URL"
              type="text"
              value={config.WA_API_URL || ""}
              onChange={(e) => onInputChange("WA_API_URL", e.target.value)}
              placeholder="https://graph.facebook.com/v21.0"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="WA_PHONE_NUMBER_ID" className="text-xs text-muted-foreground">Phone Number ID</Label>
            <Input
              id="WA_PHONE_NUMBER_ID"
              type="text"
              value={config.WA_PHONE_NUMBER_ID || ""}
              onChange={(e) => onInputChange("WA_PHONE_NUMBER_ID", e.target.value)}
              placeholder="e.g. 109384738291039"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="WA_ACCESS_TOKEN" className="text-xs text-muted-foreground">System User Access Token (Permanent)</Label>
              <button
                type="button"
                onClick={() => setShowAccessToken(!showAccessToken)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showAccessToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAccessToken ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="WA_ACCESS_TOKEN"
              type={showAccessToken ? "text" : "password"}
              value={config.WA_ACCESS_TOKEN || ""}
              onChange={(e) => onInputChange("WA_ACCESS_TOKEN", e.target.value)}
              placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="WA_VERIFY_TOKEN" className="text-xs text-muted-foreground">Webhook Verify Token</Label>
              <button
                type="button"
                onClick={() => setShowVerifyToken(!showVerifyToken)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showVerifyToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showVerifyToken ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="WA_VERIFY_TOKEN"
              type={showVerifyToken ? "text" : "password"}
              value={config.WA_VERIFY_TOKEN || ""}
              onChange={(e) => onInputChange("WA_VERIFY_TOKEN", e.target.value)}
              placeholder="Verify Token string..."
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
          <ActionTooltip label="Simpan Konfigurasi WhatsApp Gateway" shortcut="Ctrl+S">
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
