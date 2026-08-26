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
  CyberWaveform3D,
  PebbleBot3D,
  LinearIsometricShowcase,
} from "@k2net/ui";
import {
  Box,
  Check,
  CheckCircle2,
  LogIn,
  MousePointerClick,
  Move3d,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUIStore, type Ai3DModelType } from "@/store/ui-store";

interface MascotAsset {
  id: Ai3DModelType;
  title: string;
  subtitle: string;
  category: "Login & Hero Visual" | "AI Assistant Mascot";
  typeTag: string;
  description: string;
  renderComponent: React.ReactNode;
  specs: {
    polyCount: string;
    drawCalls: string;
    material: string;
    interaction: string;
  };
  features: string[];
}

export default function Assets3DPage() {
  const activeAiMascot = useUIStore((state) => state.aiMascotVariant) || "pebble";
  const activeLogin3D = useUIStore((state) => state.login3DVariant) || "waveform";
  const setAiMascotVariant = useUIStore((state) => state.setAiMascotVariant);
  const setLogin3DVariant = useUIStore((state) => state.setLogin3DVariant);

  const [selectedPreview, setSelectedPreview] = useState<Ai3DModelType>("waveform");
  const [previewKey, setPreviewKey] = useState(0);

  const handleSetActiveAi = (id: Ai3DModelType, title: string) => {
    setAiMascotVariant(id);
    try {
      localStorage.setItem("k2net_ai_mascot_variant", id);
      const stored = localStorage.getItem("ftth-ui-settings");
      const obj = stored ? JSON.parse(stored) : { state: {} };
      obj.state = { ...obj.state, aiMascotVariant: id };
      localStorage.setItem("ftth-ui-settings", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}

    toast.success(`Maskot AI Assistant diubah ke "${title}"!`, {
      description: "Visual 3D pada panel floating AI dan full-screen chat telah diperbarui.",
    });
  };

  const handleSetActiveLogin = (id: Ai3DModelType, title: string) => {
    setLogin3DVariant(id);
    try {
      localStorage.setItem("k2net_login_3d_variant", id);
      const stored = localStorage.getItem("ftth-ui-settings");
      const obj = stored ? JSON.parse(stored) : { state: {} };
      obj.state = { ...obj.state, login3DVariant: id };
      localStorage.setItem("ftth-ui-settings", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}

    toast.success(`Visual 3D Halaman Login diubah ke "${title}"!`, {
      description: "Buka halaman /login untuk melihat visualisasi 3D yang baru dipilih.",
    });
  };

  const ASSETS: MascotAsset[] = [
    {
      id: "waveform",
      title: "Cyber Waveform Mesh",
      subtitle: "Mathematical Optical Wave Surface Dynamics",
      category: "Login & Hero Visual",
      typeTag: "Parametric Fluid",
      description:
        "Matriks partikel 3D yang mengalir bergelombang halus dengan gradasi warna Deep Slate ke Sky Blue dan Emerald Neon, serta riak gelombang interaktif mengikuti kursor.",
      renderComponent: (
        <CyberWaveform3D
          key={`wav-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~3.7k Poligon",
        drawCalls: "2 Draw Calls",
        material: "Parametric Vertex Color Points + Beacon Spheres",
        interaction: "Mouse Ripple Wave Physics + Parallax Tilt",
      },
      features: [
        "50x34 Dynamic mathematical sinusoidal fluid particle grid",
        "Real-time cursor wave ripple physics disturbance",
        "6 Floating telemetry node beacons riding wave peaks",
        "Adaptive high-contrast visibility for Dark and Light modes",
      ],
    },
    {
      id: "pebble",
      title: "Pebble Bot",
      subtitle: "Cute Ceramic Companion with Floating Satellite Ears",
      category: "AI Assistant Mascot",
      typeTag: "Character Mascot",
      description:
        "Robot mungil berbentuk batu halus (pebble) bertekstur keramik krem matte, visor kaca hitam melengkung glossy, garis mata LED biru tersenyum, dan 2 telinga antena satelit nirkabel.",
      renderComponent: (
        <PebbleBot3D
          key={`peb-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~3.5k Poligon",
        drawCalls: "1 Draw Call",
        material: "Matte Cream Ceramic + Glossy Dark Visor",
        interaction: "Cursor Gaze Tracking + Ear Levitation",
      },
      features: [
        "Gaze tracking: Menoleh & menatap langsung kursor pengguna",
        "2 Wireless satellite antenna ears dengan osilasi bebas",
        "Spring squash-and-stretch wobble bounce saat diklik",
        "Garis mata LED digital biru ramah tersenyum",
      ],
    },
  ];

  const currentActiveAsset = ASSETS.find((a) => a.id === selectedPreview) || ASSETS[0];

  return (
    <PageLayout variant="dashboard" spaceY="space-y-8">
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
            Core WebGL 3D Models &amp; Lightweight Linear-Style Pure SVG Isometric Wireframes for K2NET Enterprise SaaS Platform.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI: Pebble Bot</span>
          </Badge>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <LogIn className="h-3.5 w-3.5" />
            <span>Login: Cyber Waveform Mesh</span>
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

      <div className="space-y-8">
        {/* ── 1. Top Hero: Interactive 3D Core Viewport ── */}
        <Card className="border-border/60 bg-gradient-to-b from-card via-card to-card/90 overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.15),transparent_60%)]" />

          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider text-primary border border-primary/30 bg-primary/5">
                    Core WebGL Viewport
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">60 FPS Realtime</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                    {currentActiveAsset.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Move3d className="h-5 w-5 text-primary" />
                  <span>{currentActiveAsset.title}</span>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {currentActiveAsset.subtitle}
                </CardDescription>
              </div>

              {/* Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1.5 rounded-xl border border-border/50">
                {ASSETS.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedPreview(asset.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap",
                      selectedPreview === asset.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                    )}
                  >
                    {asset.title}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* 3D Interactive Canvas */}
              <div className="lg:col-span-2 relative min-h-[360px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-black/40 via-black/20 to-black/50 border border-border/40 shadow-inner overflow-hidden">
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                <div className="relative z-10 p-4">
                  {currentActiveAsset.renderComponent}
                </div>

                <div className="absolute bottom-3 left-4 flex items-center gap-2 pointer-events-none select-none">
                  <Badge variant="outline" className="text-[10px] font-mono border-border/60 bg-black/60 text-muted-foreground gap-1.5 backdrop-blur-md">
                    <MousePointerClick className="h-3 w-3 text-primary animate-pulse" />
                    <span>Interactive Physics Active</span>
                  </Badge>
                </div>
              </div>

              {/* Specs & Capabilities */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/75 mb-3">
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl border border-border/40 bg-muted/20">
                      <span className="text-[10px] text-muted-foreground block">Polycount</span>
                      <span className="text-foreground font-semibold">{currentActiveAsset.specs.polyCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border/40 bg-muted/20">
                      <span className="text-[10px] text-muted-foreground block">Performance</span>
                      <span className="text-foreground font-semibold">{currentActiveAsset.specs.drawCalls}</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border/40 bg-muted/20 col-span-2">
                      <span className="text-[10px] text-muted-foreground block">Materials</span>
                      <span className="text-foreground font-semibold text-[11px]">{currentActiveAsset.specs.material}</span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border/40 bg-muted/20 col-span-2">
                      <span className="text-[10px] text-muted-foreground block">Interaction Model</span>
                      <span className="text-primary font-semibold text-[11px]">{currentActiveAsset.specs.interaction}</span>
                    </div>
                  </div>
                </div>

                {/* Key Capabilities */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/75">
                    Feature Highlights
                  </h4>
                  <ul className="space-y-1">
                    {currentActiveAsset.features.slice(0, 3).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dual Target Switchers */}
                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => handleSetActiveAi(currentActiveAsset.id, currentActiveAsset.title)}
                    variant={activeAiMascot === currentActiveAsset.id ? "secondary" : "default"}
                    className={cn(
                      "w-full gap-2 text-xs font-semibold shadow-sm",
                      activeAiMascot === currentActiveAsset.id
                        ? "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {activeAiMascot === currentActiveAsset.id ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Active on AI Assistant
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Set as AI Assistant Mascot
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSetActiveLogin(currentActiveAsset.id, currentActiveAsset.title)}
                    variant={activeLogin3D === currentActiveAsset.id ? "secondary" : "outline"}
                    className={cn(
                      "w-full gap-2 text-xs font-semibold shadow-sm border",
                      activeLogin3D === currentActiveAsset.id
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {activeLogin3D === currentActiveAsset.id ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Active on Login Hero Page
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 text-muted-foreground" /> Set as Login Hero Visual
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Technical Isometric Wireframe Figures (1:1 Linear.app Style) ── */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary">
                  100% Pure SVG Vector Line Art
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">0% GPU Overhead • Ultra-Lightweight &bull; Instant 60 FPS</span>
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Technical Isometric Architecture Gallery</span>
                <span className="text-xs text-muted-foreground font-mono font-normal">(Linear.app Aesthetic)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mathematical 30° axonometric vector wireframes with interactive hover extrusion, dashed projection lines, and monospace technical labeling.
              </p>
            </div>
          </div>

          <LinearIsometricShowcase />
        </div>
      </div>
    </PageLayout>
  );
}
