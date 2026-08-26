"use client";

import React, { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageLayout,
  PebbleBot3D,
  LinearIsometricShowcase,
} from "@k2net/ui";
import {
  Bot,
  Box,
  Check,
  LogIn,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useUIStore, type LoginHeroFigureId } from "@/store/ui-store";

export default function Assets3DPage() {
  const activeLoginHeroId = useUIStore((state) => state.activeLoginHeroId) || "fig-01";
  const setActiveLoginHeroId = useUIStore((state) => state.setActiveLoginHeroId);
  const [previewKey, setPreviewKey] = useState(0);

  const handleSetLoginHero = (id: string, title: string) => {
    const heroId = id as LoginHeroFigureId;
    setActiveLoginHeroId(heroId);
    try {
      localStorage.setItem("k2net_active_login_hero", heroId);
      localStorage.setItem("k2net_login_hero_variant", heroId);
      localStorage.setItem("k2net_login_3d_variant", heroId);
      const stored = localStorage.getItem("ftth-ui-settings");
      const obj = stored ? JSON.parse(stored) : { state: {} };
      obj.state = { ...obj.state, activeLoginHeroId: heroId };
      localStorage.setItem("ftth-ui-settings", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}

    toast.success(`Visual Halaman Login diubah ke "${title}"!`, {
      description: "Buka halaman /login untuk melihat visualisasi yang baru dipilih.",
    });
  };

  return (
    <PageLayout variant="dashboard" spaceY="space-y-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
              VISUAL ASSETS &amp; ARCHITECTURE STUDIO
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Box className="h-6 w-6 text-primary" />
            <span>Interactive Visual Assets Laboratory</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Pure SVG Isometric Architecture Figures (Linear Style) &amp; GSAP Animated Companion Mascot for AI Assistant.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <Bot className="h-3.5 w-3.5" />
            <span>AI Mascot: Pebble Bot</span>
          </Badge>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <LogIn className="h-3.5 w-3.5" />
            <span>Active Login Hero: {activeLoginHeroId.toUpperCase()}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewKey((k) => k + 1)}
            className="gap-1.5 border-border hover:border-primary/50 text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Reset Viewport</span>
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 1: AI Assistant 3D Companion Mascot (Pebble Bot) ────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Card className="border-border/60 bg-gradient-to-b from-card via-card to-card/90 overflow-hidden relative shadow-xl">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider text-primary border border-primary/30 bg-primary/5">
                  Dedicated AI Mascot (Pure SVG Vector)
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Real-Time Cursor Gaze</span>
              </div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span>Pebble Bot Companion</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Cute ceramic companion robot powering the floating AI assistant and full-screen spatial chat interface.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Active Globally</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="relative h-[220px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-black/40 to-black/60 border border-border/40 overflow-hidden">
              <PebbleBot3D key={`peb-showcase-${previewKey}`} size="md" interactive={true} />
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/75">
                Mascot Capabilities &amp; Behavior
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/85">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Realtime cursor gaze tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Levitating wireless satellite ears</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Interactive squash &amp; bounce on click</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>Matte ceramic texture with dark visor</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: Technical Isometric Architecture Gallery (FIG 0.1-0.6) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary">
                100% Pure SVG Vector Line Art
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">0% GPU Overhead &bull; Solid Black + White Lines &bull; 6 Core Figures</span>
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Technical Isometric Architecture Gallery</span>
              <span className="text-xs text-muted-foreground font-mono font-normal">(FIG 0.1 — FIG 0.6)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Klik tombol &quot;Set as Login Hero&quot; pada salah satu figur di bawah untuk menjadikannya visual aktif di halaman login.
            </p>
          </div>
        </div>

        {/* Unified 6-Card Gallery with active indicator & switch handler */}
        <LinearIsometricShowcase
          activeHeroId={activeLoginHeroId}
          onSetLoginHero={handleSetLoginHero}
        />
      </div>
    </PageLayout>
  );
}
