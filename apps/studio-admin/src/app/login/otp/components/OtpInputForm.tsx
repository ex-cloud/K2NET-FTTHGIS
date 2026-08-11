"use client";

import React from "react";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@k2net/ui";

interface OtpInputFormProps {
  otp: string[];
  onChangeDigit: (index: number, val: string) => void;
  onKeyDownDigit: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  isVerifying: boolean;
  countdown: number;
  isSending: boolean;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: () => void;
  onChangeMethodClick: () => void;
}

export function OtpInputForm({
  otp,
  onChangeDigit,
  onKeyDownDigit,
  inputRefs,
  isVerifying,
  countdown,
  isSending,
  onSendOtp,
  onVerifyOtp,
  onChangeMethodClick,
}: OtpInputFormProps) {
  return (
    <div className="space-y-6">
      {/* 6 Digit Input Fields */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-muted-foreground">Masukkan 6 Digit OTP</label>
          {countdown > 0 ? (
            <span className="text-[10px] text-muted-foreground">Kirim ulang dalam {countdown}s</span>
          ) : (
            <button 
              onClick={onSendOtp} 
              disabled={isSending}
              className="text-[10px] text-primary font-semibold hover:underline"
            >
              Kirim Ulang OTP
            </button>
          )}
        </div>
        
        <div className="flex justify-between gap-2.5">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              maxLength={1}
              value={digit}
              disabled={isVerifying}
              ref={(el) => { inputRefs.current[idx] = el; }}
              onChange={(e) => onChangeDigit(idx, e.target.value)}
              onKeyDown={(e) => onKeyDownDigit(idx, e)}
              className="w-12 h-12 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-center text-xl font-bold text-foreground outline-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <Button
          onClick={onVerifyOtp}
          disabled={isVerifying}
          className="w-full h-11 bg-linear-to-r from-primary to-primary/85 hover:from-primary/90 text-foreground transition-all shadow-lg font-semibold"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verifikasi & Masuk
            </>
          )}
        </Button>

        <Button
          onClick={onChangeMethodClick}
          variant="outline"
          className="w-full h-11 border-border bg-muted/30 text-muted-foreground hover:bg-muted/40 text-xs"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Ganti Metode Pengiriman
        </Button>
      </div>
    </div>
  );
}
