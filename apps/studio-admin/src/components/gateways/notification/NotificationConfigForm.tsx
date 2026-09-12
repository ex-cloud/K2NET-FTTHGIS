import React, { useState } from "react";
import { Lock, Server, MessageCircle, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface NotificationConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function NotificationConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: NotificationConfigFormProps) {
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* Internal Auth Details */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Keamanan & Akses Internal
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Token static yang digunakan untuk autentikasi komunikasi antar microservice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="GATEWAY_TOKEN" className="text-xs text-muted-foreground">Gateway Static Token</Label>
              <button
                type="button"
                onClick={() => setShowAuthToken(!showAuthToken)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showAuthToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAuthToken ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="GATEWAY_TOKEN"
              type={showAuthToken ? "text" : "password"}
              value={config.GATEWAY_TOKEN || ""}
              onChange={(e) => onInputChange("GATEWAY_TOKEN", e.target.value)}
              placeholder="Masukkan Token Baru..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Redis Connection Details */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Broker Antrean (Redis)
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Alamat koneksi Redis untuk asynq queue worker pengiriman WhatsApp/SMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="REDIS_ADDR" className="text-xs text-muted-foreground">Redis Connection Host</Label>
            <Input
              id="REDIS_ADDR"
              type="text"
              value={config.REDIS_ADDR || ""}
              onChange={(e) => onInputChange("REDIS_ADDR", e.target.value)}
              placeholder="127.0.0.1:6379"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Twilio Credentials */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" /> Twilio Provider Credentials
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Kredensial akun Twilio Anda untuk mengaktifkan modul SMS & WhatsApp Business API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="TWILIO_ACCOUNT_SID" className="text-xs text-muted-foreground">Twilio Account SID</Label>
            <Input
              id="TWILIO_ACCOUNT_SID"
              type="text"
              value={config.TWILIO_ACCOUNT_SID || ""}
              onChange={(e) => onInputChange("TWILIO_ACCOUNT_SID", e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="TWILIO_AUTH_TOKEN" className="text-xs text-muted-foreground">Twilio Auth Token</Label>
              <button
                type="button"
                onClick={() => setShowTwilioToken(!showTwilioToken)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showTwilioToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showTwilioToken ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="TWILIO_AUTH_TOKEN"
              type={showTwilioToken ? "text" : "password"}
              value={config.TWILIO_AUTH_TOKEN || ""}
              onChange={(e) => onInputChange("TWILIO_AUTH_TOKEN", e.target.value)}
              placeholder="Auth Token Baru..."
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="TWILIO_FROM_NUMBER" className="text-xs text-muted-foreground">Twilio From Number (WhatsApp/SMS Sender ID)</Label>
            <Input
              id="TWILIO_FROM_NUMBER"
              type="text"
              value={config.TWILIO_FROM_NUMBER || ""}
              onChange={(e) => onInputChange("TWILIO_FROM_NUMBER", e.target.value)}
              placeholder="whatsapp:+14155238886"
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
          <ActionTooltip label="Simpan Konfigurasi Notification Gateway" shortcut="Ctrl+S">
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
