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
  VoxelTopology3D,
  CloudNetClay3D,
  AetherJelly3D,
  PebbleBot3D,
  FiberGlobe3D,
  CyberWaveform3D,
  LinearIsometricShowcase,
} from "@k2net/ui";
import {
  Box,
  Check,
  CheckCircle2,
  LogIn,
  MousePointerClick,
  Move3d,
  Orbit,
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
  const activeAiMascot = useUIStore((state) => state.aiMascotVariant) || "voxel";
  const activeLogin3D = useUIStore((state) => state.login3DVariant) || "globe";
  const setAiMascotVariant = useUIStore((state) => state.setAiMascotVariant);
  const setLogin3DVariant = useUIStore((state) => state.setLogin3DVariant);

  const [selectedPreview, setSelectedPreview] = useState<Ai3DModelType>(activeLogin3D || "globe");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "HERO" | "MASCOT">("ALL");
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
    // ─── LOGIN & HERO SHOWCASE CANDIDATES ───────────────────────────────────
    {
      id: "globe",
      title: "3D Fiber Earth Globe",
      subtitle: "Interactive Global FTTH GIS Network Telemetry",
      category: "Login & Hero Visual",
      typeTag: "Spatial Telemetry",
      description:
        "Bola dunia 3D kaca obsidian gelap berputar dengan titik koordinat OLT neon emerald, busur kabel optik melengkung 3D, dan galaksi stardust realistis yang menyebar di seluruh layar.",
      renderComponent: (
        <FiberGlobe3D
          key={`glb-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~4.5k Poligon",
        drawCalls: "3 Draw Calls",
        material: "Obsidian Glass + Fibonacci Points + Wide Star Constellation",
        interaction: "360° Drag + GPS Beacons + Orbital Auto-Spin",
      },
      features: [
        "1,400 Fibonacci continental surface landmass grid points",
        "650 Wide deep-space multi-colored galaxy stars across full screen",
        "10 Global telecommunication hubs (Jakarta, Tokyo, NY, London, etc.)",
        "3D Parabolic optical fiber curved arcs with traveling photons",
      ],
    },
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
        "52x36 Dynamic mathematical sinusoidal fluid particle grid",
        "Real-time cursor wave ripple physics disturbance",
        "6 Floating telemetry node beacons riding wave peaks",
        "Ambient stardust perspective constellation",
      ],
    },

    // ─── AI ASSISTANT MASCOT CANDIDATES ─────────────────────────────────────
    {
      id: "voxel",
      title: "Voxel Data Matrix Cube",
      subtitle: "Spatial PostGIS & Vector Embedding Core",
      category: "AI Assistant Mascot",
      typeTag: "Architectural Voxel",
      description:
        "Kubus modular isometrik tersusun dari balok-balok porselen putih dan sky blue dengan jendela aperture neon cyan yang memancarkan 16 berkas sinar laser fiber optik.",
      renderComponent: (
        <VoxelTopology3D
          key={`vox-${previewKey}`}
          size="md"
          primaryColor="#38bdf8"
          accentColor="#00f2fe"
          coreColor="#f8fafc"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~3.8k Poligon",
        drawCalls: "2 Draw Calls",
        material: "Porcelain + Glowing Cyan Emissive",
        interaction: "Mouse Parallax + Traveling Photons + Wave",
      },
      features: [
        "Isometric 3D perspective orientation",
        "16 Radial laser beams with moving photon packets",
        "16 Satellite node beads with concentric halo rings",
        "450-point ambient rotating nebula stardust cloud",
      ],
    },
    {
      id: "cloud",
      title: "CloudNet Clay",
      subtitle: "Organic Metaball Cloud Formation (1:1 Cloudflare Style)",
      category: "AI Assistant Mascot",
      typeTag: "Organic Claymorphism",
      description:
        "Kluster 20 bola matte velvet clay organik yang saling terhubung dengan gradasi Sky Blue, Porcelain White, dan Cool Gray, serta pendaran neon cyan di sela-sela lipatan awan.",
      renderComponent: (
        <CloudNetClay3D
          key={`cld-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~4.2k Poligon",
        drawCalls: "1 Draw Call",
        material: "Velvet Soft Clay + Subsurface Neon Glow",
        interaction: "360° Drag Spin + Squash & Stretch Wobble",
      },
      features: [
        "Putar 360° bebas dengan inersia friksi putaran",
        "Spring squish & wobble physics saat diklik",
        "Harmonic floating levitation & breathing undulation",
        "Internal neon cyan glow pulsing through crevices",
      ],
    },
    {
      id: "jelly",
      title: "Aether Jelly",
      subtitle: "Biomorphic Fiber Jellyfish / Coral Node",
      category: "AI Assistant Mascot",
      typeTag: "Biomorphic Glass",
      description:
        "Kubah ubur-ubur biomorphic dari kaca frosted translucent dengan inti organ koral bercahaya lilac & cyan neon, serta 12 tentakel serat optik melayang yang bergelombang lentur.",
      renderComponent: (
        <AetherJelly3D
          key={`jel-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~2.6k Poligon",
        drawCalls: "3 Draw Calls",
        material: "Frosted Glass Transmission + Fiber Splines",
        interaction: "Swimming Propulsion + Wave Tendrils",
      },
      features: [
        "Swimming propulsion levitation cycle",
        "12 Dynamic physics wave undulating fiber tendrils",
        "Traveling photon packets moving down tentacles",
        "Bioluminescent ambient particle cloud",
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

  const filteredAssets = ASSETS.filter((asset) => {
    if (filterCategory === "HERO") return asset.category === "Login & Hero Visual";
    if (filterCategory === "MASCOT") return asset.category === "AI Assistant Mascot";
    return true;
  });

  const currentActiveAsset = ASSETS.find((a) => a.id === selectedPreview) || ASSETS[0];

  return (
    <PageLayout variant="dashboard" spaceY="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
              3D INTERACTIVE VISUALIZATION STUDIO
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Box className="h-6 w-6 text-primary" />
            <span>3D Assets &amp; Mascot Laboratory</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Interactive Three.js WebGL 3D asset laboratory for K2NET Enterprise SaaS Platform. Preview, rotate 360°, inspect physics, and dynamically assign models to AI Assistant or Login Hero.
          </p>
        </div>

        {/* Status Indicators for both AI & Login */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI: {ASSETS.find((a) => a.id === activeAiMascot)?.title || "Voxel"}</span>
          </Badge>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <LogIn className="h-3.5 w-3.5" />
            <span>Login: {ASSETS.find((a) => a.id === activeLogin3D)?.title || "Globe"}</span>
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
        {/* ── 1. Top Hero: Interactive 3D Holographic Laboratory ── */}
        <Card className="border-border/60 bg-gradient-to-b from-card via-card to-card/90 overflow-hidden relative shadow-2xl">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.15),transparent_60%)]" />

          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider text-primary border border-primary/30 bg-primary/5">
                    Live WebGL Viewport
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">60-120 FPS Realtime</span>
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

              {/* Selector Tabs for quick switching inside hero */}
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
                    {asset.title.split(" ")[0]} {asset.title.split(" ")[1] || ""}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* 3D Interactive Stage Canvas */}
              <div className="lg:col-span-2 relative min-h-[380px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-black/40 via-black/20 to-black/50 border border-border/40 shadow-inner overflow-hidden">
                {/* Dot Grid Backdrop */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* 3D Component Render */}
                <div className="relative z-10 p-4">
                  {currentActiveAsset.renderComponent}
                </div>

                {/* Interactive Hint Overlay */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2 pointer-events-none select-none">
                  <Badge variant="outline" className="text-[10px] font-mono border-border/60 bg-black/60 text-muted-foreground gap-1.5 backdrop-blur-md">
                    <MousePointerClick className="h-3 w-3 text-primary animate-pulse" />
                    <span>Click / Drag to Rotate 360°</span>
                  </Badge>
                </div>
              </div>

              {/* Specs & Dual Target Switchers */}
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
                      <span className="text-[10px] text-muted-foreground block">Materials & Shaders</span>
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

                {/* Dual Set Active Buttons (AI vs Login) */}
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
                        <LogIn className="h-4 w-4 text-muted-foreground" /> Set as Login Hero 3D Visual
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Curated 6 Models Showcase Grid with Filter Tabs ── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <Orbit className="h-5 w-5 text-primary" />
                <span>3D Component Catalog ({filteredAssets.length})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated 3D models for FTTH GIS: 2 Hero Visualizations &amp; 4 AI Assistant Mascots.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50">
              <button
                onClick={() => setFilterCategory("ALL")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                  filterCategory === "ALL"
                    ? "bg-card text-foreground font-bold shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({ASSETS.length})
              </button>
              <button
                onClick={() => setFilterCategory("HERO")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                  filterCategory === "HERO"
                    ? "bg-card text-foreground font-bold shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Login &amp; Hero (2)
              </button>
              <button
                onClick={() => setFilterCategory("MASCOT")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                  filterCategory === "MASCOT"
                    ? "bg-card text-foreground font-bold shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                AI Mascots (4)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => {
              const isAiActive = activeAiMascot === asset.id;
              const isLoginActive = activeLogin3D === asset.id;
              const isSelected = selectedPreview === asset.id;

              return (
                <Card
                  key={asset.id}
                  className={cn(
                    "flex flex-col justify-between border transition-all duration-300 overflow-hidden bg-card hover:border-primary/50 group",
                    isSelected && "ring-2 ring-primary/40 border-primary/80 shadow-xl",
                    (isAiActive || isLoginActive) && "border-primary/60 bg-gradient-to-b from-primary/5 to-card"
                  )}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono uppercase tracking-wider border-border text-muted-foreground"
                      >
                        {asset.typeTag}
                      </Badge>

                      <div className="flex items-center gap-1.5">
                        {isAiActive && (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-md">
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </span>
                        )}
                        {isLoginActive && (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-foreground/90 bg-muted border border-border px-1.5 py-0.5 rounded-md">
                            <LogIn className="h-2.5 w-2.5 text-primary" /> Login
                          </span>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {asset.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {asset.description}
                    </CardDescription>
                  </CardHeader>

                  {/* 3D Mini Viewport Container */}
                  <div
                    onClick={() => setSelectedPreview(asset.id)}
                    className="relative mx-5 my-2 h-[220px] rounded-xl bg-gradient-to-b from-black/50 via-black/25 to-black/60 border border-border/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all shadow-inner"
                  >
                    <div className="relative z-10 transform scale-90">
                      {asset.renderComponent}
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-[9px] font-mono bg-black/70 text-foreground border border-white/10 backdrop-blur-md">
                        Click to Inspect
                      </Badge>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <CardContent className="p-5 pt-3 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border/40 pt-3">
                      <span>{asset.specs.polyCount}</span>
                      <span className="text-primary font-semibold">{asset.specs.drawCalls}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={isAiActive ? "secondary" : "default"}
                        onClick={() => handleSetActiveAi(asset.id, asset.title)}
                        className={cn(
                          "text-[11px] font-semibold gap-1",
                          isAiActive
                            ? "border border-primary/40 bg-primary/10 text-primary"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {isAiActive ? (
                          <>
                            <Check className="h-3 w-3" /> Active AI
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" /> Set AI
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant={isLoginActive ? "secondary" : "outline"}
                        onClick={() => handleSetActiveLogin(asset.id, asset.title)}
                        className={cn(
                          "text-[11px] font-semibold gap-1 border",
                          isLoginActive
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-foreground"
                        )}
                      >
                        {isLoginActive ? (
                          <>
                            <Check className="h-3 w-3 text-primary" /> Active Login
                          </>
                        ) : (
                          <>
                            <LogIn className="h-3 w-3 text-muted-foreground" /> Set Login
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── 3. Technical Isometric Wireframe Figures (1:1 Linear.app Style) ── */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary">
                  100% SVG Vector Line Art
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">0% GPU Overhead • Instant 60 FPS</span>
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Technical Isometric Wireframe Figures</span>
                <span className="text-xs text-muted-foreground font-mono font-normal">(Linear.app Aesthetic)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Precision 30° axonometric vector wireframes with interactive hover extrusion, dashed projection lines, and monospace technical labeling.
              </p>
            </div>
          </div>

          <LinearIsometricShowcase />
        </div>
      </div>
    </PageLayout>
  );
}
