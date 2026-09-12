import React, { useState } from "react";
import { Globe, Compass, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, ActionTooltip } from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";

interface MapConfigFormProps {
  config: Record<string, string>;
  saving: boolean;
  onInputChange: (key: string, value: string) => void;
  onSave: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function MapConfigForm({
  config,
  saving,
  onInputChange,
  onSave,
  onReset,
}: MapConfigFormProps) {
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showHereKey, setShowHereKey] = useState(false);

  return (
    <form onSubmit={onSave} className="lg:col-span-2 space-y-6">
      {/* Google Maps API Keys */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Google Maps API
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Kredensial Google Maps API untuk Forward & Reverse Geocoding alamat pelanggan FTTH.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="GOOGLE_MAPS_API_KEY" className="text-xs text-muted-foreground">Google Maps API Key</Label>
              <button
                type="button"
                onClick={() => setShowGoogleKey(!showGoogleKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showGoogleKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showGoogleKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="GOOGLE_MAPS_API_KEY"
              type={showGoogleKey ? "text" : "password"}
              value={config.GOOGLE_MAPS_API_KEY || ""}
              onChange={(e) => onInputChange("GOOGLE_MAPS_API_KEY", e.target.value)}
              placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-input border-border text-foreground text-xs focus:border-primary/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* HERE Maps API Keys (Failover) */}
      <Card glowingEffect className="bg-card/60 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> HERE Maps API (Failover Provider)
          </CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground">
            Provider alternatif yang digunakan otomatis jika Google Maps mengalami API limit quota atau timeout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="HERE_MAPS_API_KEY" className="text-xs text-muted-foreground">HERE Maps API Key</Label>
              <button
                type="button"
                onClick={() => setShowHereKey(!showHereKey)}
                className="text-[10px] text-muted-foreground hover:text-muted-foreground flex items-center gap-1"
              >
                {showHereKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showHereKey ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <Input
              id="HERE_MAPS_API_KEY"
              type={showHereKey ? "text" : "password"}
              value={config.HERE_MAPS_API_KEY || ""}
              onChange={(e) => onInputChange("HERE_MAPS_API_KEY", e.target.value)}
              placeholder="HERE API Key..."
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
          <ActionTooltip label="Simpan Konfigurasi Map Gateway" shortcut="Ctrl+S">
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
