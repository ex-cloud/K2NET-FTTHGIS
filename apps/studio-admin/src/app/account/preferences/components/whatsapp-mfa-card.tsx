import React from "react";
import { Input } from "@k2net/ui";
import { Button } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { Loader2, Save } from "lucide-react";

interface WhatsAppMfaCardProps {
  whatsAppNumber: string;
  setWhatsAppNumber: (val: string) => void;
  whatsAppEnabled: boolean;
  setWhatsAppEnabled: (val: boolean) => void;
  isSavingWa: boolean;
  onSubmit: (e: React.FormEvent) => void;
  themeAccentBg: string;
  themeAccentBorder: string;
}

export function WhatsAppMfaCard({
  whatsAppNumber,
  setWhatsAppNumber,
  whatsAppEnabled,
  setWhatsAppEnabled,
  isSavingWa,
  onSubmit,
  themeAccentBg,
  themeAccentBorder,
}: WhatsAppMfaCardProps) {
  return (
    <div className="border border-border bg-muted/10 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">WhatsApp &amp; 2-Step OTP Security</h2>
        <p className="text-[11px] text-muted-foreground">Configure multi-factor authentication fallback using WhatsApp.</p>
      </div>

      <form onSubmit={onSubmit}>
        <div className="p-6 space-y-6">
          
          {/* Enable MFA Checkbox */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enable WhatsApp MFA</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Kirim kode keamanan ke nomor WhatsApp Anda setiap kali login dari perangkat baru.</p>
            </div>
            <div className="md:col-span-2 flex items-center h-full pt-1">
              <input
                type="checkbox"
                id="whatsAppEnabledCheck"
                checked={whatsAppEnabled}
                onChange={(e) => setWhatsAppEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary bg-background focus:ring-primary/20 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="whatsAppEnabledCheck" className="ml-2.5 text-xs text-muted-foreground cursor-pointer">
                Aktifkan Verifikasi OTP WhatsApp
              </label>
            </div>
          </div>

          <Separator className="border-border" />

          {/* Phone Number Field */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nomor WhatsApp</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Koneksikan nomor WhatsApp untuk menerima kode verifikasi.</p>
            </div>
            <div className="md:col-span-2">
              <Input
                type="tel"
                placeholder="e.g. 08123456789 atau 628123456789"
                value={whatsAppNumber}
                onChange={(e) => setWhatsAppNumber(e.target.value)}
                className={`h-9 sm:max-w-xs bg-background/50 border-border ${themeAccentBorder} text-xs text-foreground`}
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Pastikan nomor memiliki format internasional (62) atau lokal (08) yang aktif.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-card/30 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">WhatsApp OTP provides fallback verification when email is slow.</span>
          <Button
            type="submit"
            disabled={isSavingWa}
            className={`${themeAccentBg} text-foreground font-semibold text-xs h-8 px-4 flex items-center gap-1.5 transition-all shadow-md shadow-black/25`}
          >
            {isSavingWa ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Connection
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
