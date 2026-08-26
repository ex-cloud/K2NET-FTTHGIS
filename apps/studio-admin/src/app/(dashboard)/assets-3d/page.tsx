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
  LinearGeospatialCoreHero,
  LinearFiberMatrixHero,
  LinearNetworkSentinelHero,
  LinearIsometricShowcase,
} from "@k2net/ui";
import {
  Bot,
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
import { useUIStore, type LoginHeroVariant } from "@/store/ui-store";

export default function Assets3DPage() {
  const activeLoginHero = useUIStore((state) => state.loginHeroVariant) || "geo-core";
  const setLoginHeroVariant = useUIStore((state) => state.setLoginHeroVariant);
  const [previewKey, setPreviewKey] = useState(0);

  const handleSetActiveLogin = (id: LoginHeroVariant, title: string) => {
    setLoginHeroVariant(id);
    try {
      localStorage.setItem("k2net_login_hero_variant", id);
      localStorage.setItem("k2net_login_3d_variant", id);
      const stored = localStorage.getItem("ftth-ui-settings");
      const obj = stored ? JSON.parse(stored) : { state: {} };
      obj.state = { ...obj.state, loginHeroVariant: id };
      localStorage.setItem("ftth-ui-settings", JSON.stringify(obj));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}

    toast.success(`Visual Hero Halaman Login diubah ke "${title}"!`, {
      description: "Buka halaman /login untuk melihat visualisasi yang baru dipilih.",
    });
  };

  const HERO_CANDIDATES = [
    {
      id: "geo-core" as LoginHeroVariant,
      title: "Global FTTH Geospatial Core",
      subtitle: "Monolithic Layered Core & Satellite PostGIS Telemetry Grid",
      tag: "KONSEP 1 (RECOMMENDED)",
      description:
        "Kubus bertingkat isometrik kokoh dengan kisi peta koordinat GIS di dasar, modul OLT Core, lensa aperture GPS dengan retikel hijau emerald, serta 4 node satelit ODP yang terhubung serat optik.",
      component: (
        <LinearGeospatialCoreHero
          key={`geo-${previewKey}`}
          size="full"
          interactive={true}
        />
      ),
      specs: {
        rendering: "Pure SVG Vector (0 KB GPU)",
        performance: "0 WebGL Contexts (Instant 60 FPS)",
        materials: "Solid Black Bodies + Crisp White Contours",
        interaction: "Fluid Mouse Parallax Tilt + Spring Separation",
      },
      features: [
        "Base GIS coordinate mesh grid with latitude/longitude lines",
        "Top obsidian slab with recessed GPS aperture circular lens",
        "4 Floating ODP/Gateway satellite nodes with dashed optical links",
        "Subtle continuous ambient floating levitation",
      ],
    },
    {
      id: "fiber-matrix" as LoginHeroVariant,
      title: "Stepped Fiber Matrix",
      subtitle: "Ascending Optical Wave Infrastructure Array",
      tag: "KONSEP 2",
      description:
        "14 bilah kartu isometrik solid dengan kurva eksponensial yang memvisualisasikan jalur transmisi serat optik berkecepatan sub-milidetik, dilengkapi berkas laser pemindai neon hijau.",
      component: (
        <LinearFiberMatrixHero
          key={`fib-${previewKey}`}
          size="full"
          interactive={true}
        />
      ),
      specs: {
        rendering: "Pure SVG Vector (0 KB GPU)",
        performance: "0 WebGL Contexts (Instant 60 FPS)",
        materials: "Solid Black Obsidian + Neon Laser Edge",
        interaction: "Mouse Parallax + Exponential Wave Flutter",
      },
      features: [
        "14 Stepped volumetric cards with 1px specular bevel rims",
        "Real-time sinusoidal mouse hover wave flutter physics",
        "Sweeping laser scanning telemetry pulse across the array",
        "High-contrast dark obsidian and neon emerald accents",
      ],
    },
    {
      id: "sentinel" as LoginHeroVariant,
      title: "Autonomous Network Sentinel",
      subtitle: "Modular Spire Sentinel & Real-Time Orbit Ring",
      tag: "KONSEP 3",
      description:
        "Menara pilar arsitektur isometrik modular dengan 2 cincin orbit elips berputar yang menggambarkan sistem pemantauan telemetri jaringan OLT 24/7 dan proteksi Keycloak IAM.",
      component: (
        <LinearNetworkSentinelHero
          key={`sen-${previewKey}`}
          size="full"
          interactive={true}
        />
      ),
      specs: {
        rendering: "Pure SVG Vector (0 KB GPU)",
        performance: "0 WebGL Contexts (Instant 60 FPS)",
        materials: "Solid Architectural Monolith + Orbit Rings",
        interaction: "Dynamic Pillar Extrusion + Orbit Tracking",
      },
      features: [
        "4 Solid obsidian modular pillars with directional lighting",
        "Two concentric revolving orbit rings with beacon photons",
        "Active pulsing emerald core LED beacons on spire peaks",
        "Subtle breathing levitation and spring mouse parallax",
      ],
    },
  ];

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
            Lightweight Linear-Style Pure SVG Hero Visuals for Login &amp; Three.js Mascot for AI Companion.
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
            <span>Active Login Hero: {activeLoginHero.toUpperCase()}</span>
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
      {/* ── SECTION 1: 3 Login Hero Visual Candidates (Side-by-Side 3 Cards) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary">
                100% Pure SVG Vector Line Art
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">0% GPU Overhead • Solid Black + White Lines</span>
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <Move3d className="h-5 w-5 text-primary" />
              <span>Login Hero Visual Candidates</span>
              <span className="text-xs text-muted-foreground font-mono font-normal">(Linear.app Aesthetic)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              3 konsep visual isometrik untuk halaman login. Arahkan mouse untuk menguji interaktivitas fisika dan klik tombol untuk mengaktifkannya di halaman /login.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {HERO_CANDIDATES.map((hero) => {
            const isActive = activeLoginHero === hero.id;

            return (
              <Card
                key={hero.id}
                className={cn(
                  "border bg-gradient-to-b from-card via-card to-card/90 overflow-hidden relative shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group",
                  isActive ? "border-primary/80 ring-1 ring-primary/40" : "border-border/60 hover:border-primary/50"
                )}
              >
                <div>
                  <CardHeader className="border-b border-border/40 pb-3">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider mb-1">
                      <span className="text-primary font-bold">{hero.tag}</span>
                      {isActive && (
                        <Badge className="bg-primary/20 text-primary border-primary/40 text-[9px] px-2 py-0">
                          Active on Login
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold tracking-tight text-foreground">
                      {hero.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                      {hero.subtitle}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 space-y-4">
                    {/* Visual Canvas */}
                    <div className="relative h-[260px] flex items-center justify-center rounded-xl bg-gradient-to-b from-black/50 via-black/30 to-black/60 border border-border/40 overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                      <div className="relative z-10 w-full h-full p-2 flex items-center justify-center">
                        {hero.component}
                      </div>
                      <div className="absolute bottom-2 left-3 flex items-center gap-1.5 pointer-events-none">
                        <Badge variant="outline" className="text-[9px] font-mono border-border/60 bg-black/60 text-muted-foreground gap-1 backdrop-blur-md">
                          <MousePointerClick className="h-2.5 w-2.5 text-primary" />
                          <span>Parallax</span>
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {hero.description}
                    </p>

                    {/* Features checklist */}
                    <ul className="space-y-1 pt-1 border-t border-border/40">
                      {hero.features.slice(0, 2).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                          <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-border/30 mt-auto">
                  <Button
                    onClick={() => handleSetActiveLogin(hero.id, hero.title)}
                    variant={isActive ? "secondary" : "default"}
                    size="sm"
                    className={cn(
                      "w-full gap-2 text-xs font-semibold shadow-sm mt-3",
                      isActive
                        ? "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isActive ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Active on Login Page
                      </>
                    ) : (
                      <>
                        <LogIn className="h-3.5 w-3.5" /> Set as Login Hero
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION 2: AI Assistant 3D Companion Mascot (Pebble Bot) ────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Card className="border-border/60 bg-gradient-to-b from-card via-card to-card/90 overflow-hidden relative shadow-xl">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider text-primary border border-primary/30 bg-primary/5">
                  Dedicated AI Mascot (Three.js WebGL)
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
      {/* ── SECTION 3: Technical Isometric Architecture Gallery (FIG 0.1-0.6) ── */}
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
              Mathematical 30° axonometric vector wireframes with interactive hover extrusion, dashed projection lines, and monospace technical labeling.
            </p>
          </div>
        </div>

        {/* Renders all 6 figures: FIG 0.1 to FIG 0.6 */}
        <LinearIsometricShowcase />
      </div>
    </PageLayout>
  );
}
