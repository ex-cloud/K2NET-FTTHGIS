"use client";

import React from "react";
import { Mail, Phone, Loader2, KeyRound } from "lucide-react";
import { Button, Input } from "@k2net/ui";

interface MethodSelectorProps {
  method: "email" | "whatsapp";
  onMethodChange: (m: "email" | "whatsapp") => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  email: string;
  isSending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function MethodSelector({
  method,
  onMethodChange,
  phoneNumber,
  onPhoneNumberChange,
  email,
  isSending,
  onSubmit,
}: MethodSelectorProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">Pilih Metode Pengiriman OTP</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onMethodChange("email")}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
              method === "email"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/40 hover:bg-muted/60 text-muted-foreground"
            }`}
          >
            <Mail className="h-5 w-5 mb-1.5" />
            <span className="text-xs font-medium">Kirim ke Email</span>
          </button>
          <button
            type="button"
            onClick={() => onMethodChange("whatsapp")}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
              method === "whatsapp"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/40 hover:bg-muted/60 text-muted-foreground"
            }`}
          >
            <Phone className="h-5 w-5 mb-1.5" />
            <span className="text-xs font-medium">Kirim ke WhatsApp</span>
          </button>
        </div>
      </div>

      {method === "email" && (
        <div className="rounded-lg bg-muted border border-border p-3.5 text-center">
          <p className="text-[10px] text-muted-foreground">KODE AKAN DIKIRIM KE ALAMAT EMAIL TERDAFTAR</p>
          <p className="text-xs font-semibold text-foreground mt-1">{email || "Email akun"}</p>
        </div>
      )}

      {method === "whatsapp" && (
        <div className="space-y-2 animate-fadeIn">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            Nomor WhatsApp Anda
          </label>
          <Input
            type="tel"
            placeholder="e.g. 08123456789 atau 628123456789"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            className="h-11 bg-background border-border text-sm focus:border-primary/50 text-foreground"
          />
          <p className="text-[10px] text-muted-foreground">Masukkan nomor yang aktif untuk menerima OTP.</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSending}
        className="w-full h-11 bg-linear-to-r from-primary to-primary/80 hover:from-primary/95 text-foreground transition-all shadow-lg"
      >
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mengirimkan Kode...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" />
            Kirim Kode OTP
          </>
        )}
      </Button>
    </form>
  );
}
