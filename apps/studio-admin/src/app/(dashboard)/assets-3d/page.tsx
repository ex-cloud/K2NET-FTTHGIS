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
  AstrolabeCore3D,
  PrismOrigami3D,
  PebbleBot3D,
} from "@k2net/ui";
import {
  Box,
  Check,
  CheckCircle2,
  Cpu,
  Layers,
  MousePointerClick,
  Move3d,
  Orbit,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUIStore, type Ai3DMascotType } from "@/store/ui-store";

interface MascotAsset {
  id: Ai3DMascotType;
  title: string;
  subtitle: string;
  category: string;
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
  const activeMascot = useUIStore((state) => state.aiMascotVariant);
  const setAiMascotVariant = useUIStore((state) => state.setAiMascotVariant);
  const [selectedPreview, setSelectedPreview] = useState<Ai3DMascotType>(activeMascot || "voxel");
  const [previewKey, setPreviewKey] = useState(0);

  const handleSetActive = (id: Ai3DMascotType, title: string) => {
    setAiMascotVariant(id);
    toast.success(`Maskot AI Assistant diubah ke "${title}"!`, {
      description: "Visual 3D pada panel floating AI dan full-screen chat telah diperbarui.",
    });
  };

  const ASSETS: MascotAsset[] = [
    {
      id: "voxel",
      title: "Voxel Data Matrix Cube",
      subtitle: "Spatial PostGIS & Vector Embedding Core",
      category: "Architectural Voxel",
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
      category: "Organic Claymorphism",
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
      category: "Biomorphic Glass",
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
      id: "astrolabe",
      title: "Astrolabe Core",
      subtitle: "Kinetic Multi-Axis Iridescent Rings",
      category: "Kinetic Sculpture",
      description:
        "Inti bola porselen putih murni diselimuti oleh 3 cincin kaca tipis iridescent (pastel teal, electric indigo, sky blue) yang berputar kinetik pada sumbu X, Y, Z berbeda.",
      renderComponent: (
        <AstrolabeCore3D
          key={`ast-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~3.1k Poligon",
        drawCalls: "2 Draw Calls",
        material: "Porcelain + Iridescent Physical Glass",
        interaction: "Multi-Axis Continuous Kinetic Rotation",
      },
      features: [
        "3 Concentric kinetic glass rings rotating on 3 axes",
        "8 Satellite beads with dynamic laser light threads",
        "Kinetic acceleration burst saat diklik",
        "Ambient stardust particle constellation",
      ],
    },
    {
      id: "prism",
      title: "Prism Origami",
      subtitle: "Floating Crystal Shards Gateway",
      category: "Geometric Prism",
      description:
        "Kluster pecahan kristal geometris tajam (oktahedron & piramida) dari keramik putih halus dan kaca kristal, terhubung oleh balok sinar energi neon biru di ruang isometrik.",
      renderComponent: (
        <PrismOrigami3D
          key={`pri-${previewKey}`}
          size="md"
          interactive={true}
        />
      ),
      specs: {
        polyCount: "~2.2k Poligon",
        drawCalls: "2 Draw Calls",
        material: "Polished Ceramic + Rainbow Crystal Glass",
        interaction: "Modular Micro-Explosion + Light Beams",
      },
      features: [
        "Modular floating shards with individual micro-rotation",
        "Interconnecting glowing neon blue laser beams",
        "Micro-expansion burst saat diklik / disentuh",
        "Rainbow dispersion lighting effects",
      ],
    },
    {
      id: "pebble",
      title: "Pebble Bot",
      subtitle: "Cute Ceramic Companion with Floating Satellite Ears",
      category: "Character Mascot",
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
              3D INTERACTIVE VISUALIZATION SYSTEM
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Box className="h-6 w-6 text-primary" />
            <span>3D Assets &amp; Mascot Gallery</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Interactive Three.js WebGL 3D asset laboratory for K2NET Enterprise SaaS Platform. Preview, rotate, inspect physics, and select active AI assistant mascot.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary gap-1.5 px-3 py-1 font-mono text-xs shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Active: {ASSETS.find((a) => a.id === activeMascot)?.title || "Voxel Matrix"}</span>
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
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer",
                      selectedPreview === asset.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                    )}
                  >
                    {asset.title.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* 3D Interactive Stage Canvas */}
              <div className="lg:col-span-2 relative min-h-[340px] flex items-center justify-center rounded-2xl bg-gradient-to-b from-black/40 via-black/20 to-black/50 border border-border/40 shadow-inner overflow-hidden">
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

              {/* Specs & Active Mascot Switcher Sidebar */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/75 mb-3">
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                      <span className="text-[10px] text-muted-foreground block">Polycount</span>
                      <span className="text-foreground font-semibold">{currentActiveAsset.specs.polyCount}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                      <span className="text-[10px] text-muted-foreground block">Performance</span>
                      <span className="text-foreground font-semibold">{currentActiveAsset.specs.drawCalls}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-border/40 bg-muted/20 col-span-2">
                      <span className="text-[10px] text-muted-foreground block">Materials & Shaders</span>
                      <span className="text-foreground font-semibold">{currentActiveAsset.specs.material}</span>
                    </div>
                    <div className="p-3 rounded-xl border border-border/40 bg-muted/20 col-span-2">
                      <span className="text-[10px] text-muted-foreground block">Interaction Model</span>
                      <span className="text-primary font-semibold">{currentActiveAsset.specs.interaction}</span>
                    </div>
                  </div>
                </div>

                {/* Key Capabilities */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/75">
                    Feature Highlights
                  </h4>
                  <ul className="space-y-1.5">
                    {currentActiveAsset.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Set as Active Mascot Button */}
                <div className="pt-2">
                  {activeMascot === currentActiveAsset.id ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/40 bg-primary/10 text-primary font-medium text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Currently active on Floating AI Assistant & Chat</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSetActive(currentActiveAsset.id, currentActiveAsset.title)}
                      className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Set as Active AI Assistant Mascot</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. All 6 Models Showcase Grid ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <Orbit className="h-5 w-5 text-primary" />
                <span>Available 3D Component Models ({ASSETS.length})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every component is modular, fully typed with TypeScript, and reusable across K2NET Studio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ASSETS.map((asset) => {
              const isCurrentActive = activeMascot === asset.id;
              const isSelected = selectedPreview === asset.id;

              return (
                <Card
                  key={asset.id}
                  className={cn(
                    "flex flex-col justify-between border transition-all duration-300 overflow-hidden bg-card hover:border-primary/50 group",
                    isSelected && "ring-2 ring-primary/40 border-primary/80 shadow-xl",
                    isCurrentActive && "border-primary/60 bg-gradient-to-b from-primary/5 to-card"
                  )}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-wider",
                          isCurrentActive ? "border-primary/50 text-primary bg-primary/10 font-bold" : "border-border text-muted-foreground"
                        )}
                      >
                        {asset.category}
                      </Badge>

                      {isCurrentActive && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3" /> Active
                        </span>
                      )}
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
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPreview(asset.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs border-border hover:border-primary/50 text-foreground"
                      >
                        Inspect Full
                      </Button>
                      <Button
                        size="sm"
                        variant={isCurrentActive ? "secondary" : "default"}
                        disabled={isCurrentActive}
                        onClick={() => handleSetActive(asset.id, asset.title)}
                        className={cn(
                          "text-xs font-semibold gap-1",
                          isCurrentActive ? "opacity-75 cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {isCurrentActive ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" /> Set Active
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
      </div>
    </PageLayout>
  );
}
