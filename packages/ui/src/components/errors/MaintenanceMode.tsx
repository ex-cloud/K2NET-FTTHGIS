"use client";

import React from "react";
import { Wrench } from "lucide-react";

export function MaintenanceMode() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 relative overflow-hidden">
      {/* Background Gradient & Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-muted/20 to-background z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6 backdrop-blur-md bg-card/40 border border-border/80 p-8 rounded-2xl shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted border border-border/50 text-muted-foreground shadow-inner mb-2">
          <Wrench className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: "3s" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">503</h1>
          <h2 className="text-xl font-bold tracking-tight text-foreground/90">Pemeliharaan Terjadwal</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Platform sedang meningkatkan performa dan menerapkan migrasi sistem database rutin. Silakan coba beberapa saat lagi.
          </p>
        </div>
      </div>
    </div>
  );
}
