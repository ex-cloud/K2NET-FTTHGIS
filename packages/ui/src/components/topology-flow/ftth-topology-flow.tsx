"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import gsap from "gsap";
import {
  Globe2,
  Network,
  Layers,
  Box,
  Wifi,
  Activity,
  Tv,
  PhoneCall,
  ShieldCheck,
  Cpu,
  Radio,
  Zap,
} from "lucide-react";
import { cn } from "../../utils";

export interface FtthTopologyFlowProps {
  className?: string;
  tenantName?: string;
  rxPowerDbm?: number;
  realtimeLatencyMs?: number;
  interactive?: boolean;
}

interface NodeItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  icon?: React.ElementType;
}

interface CablePath {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function FtthTopologyFlow({
  className,
  tenantName = "PT Nusantara",
  rxPowerDbm = -19.4,
  realtimeLatencyMs = 12,
  interactive = true,
}: FtthTopologyFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // ── Column 1: Core Uplink & Backbone (Equivalent to "STEAM" in Bridgeplay) ─
  const col1Nodes: NodeItem[] = useMemo(
    () => [
      {
        id: "ixp-upstream",
        title: "Tier-1 Upstream IXP",
        subtitle: "OpenIXP • Dual 100G Trunk",
        meta: "100G QSFP28",
        icon: Globe2,
      },
      {
        id: "bgp-router",
        title: "Core BGP Router",
        subtitle: "AS-59310 Peering Fabric",
        meta: "0.2ms Core",
        icon: Network,
      },
    ],
    []
  );

  // ── Column 3: Passive ODN Outside Plant (Equivalent to "ENGINES" in Bridgeplay)
  const col3Nodes: NodeItem[] = useMemo(
    () => [
      {
        id: "odf-bay",
        title: "ODF Main Bay",
        subtitle: "SC/APC Trunk Patch",
        meta: "0.12 dB Loss",
        icon: Layers,
      },
      {
        id: "fdt-cabinet",
        title: "FDT Street Cabinet",
        subtitle: "FDT-04 • 1:4 PLC Splitter",
        meta: "Feeder Trunk",
        icon: Box,
      },
      {
        id: "fat-pole",
        title: "FAT Pole Terminal",
        subtitle: "FAT-12 • 1:8 Drop Splitter",
        meta: "Aerial Drop",
        icon: Radio,
      },
    ],
    []
  );

  // ── Column 4: Subscriber Services (Equivalent to "GRAPHICS" in Bridgeplay) ─
  const col4Nodes: NodeItem[] = useMemo(
    () => [
      {
        id: "svc-internet",
        title: "Gigabit Internet",
        subtitle: "PPPoE / IPoE Dual Stack",
        meta: "IPv6 Native",
        icon: Activity,
      },
      {
        id: "svc-iptv",
        title: "IPTV Multicast 4K",
        subtitle: "IGMP Snooping v3 Stream",
        meta: "Zero Jitter",
        icon: Tv,
      },
      {
        id: "svc-voip",
        title: "VoIP SIP Trunk",
        subtitle: "G.711 Telephony Gateway",
        meta: "QoS High",
        icon: PhoneCall,
      },
      {
        id: "svc-vlan",
        title: "VLAN Q-in-Q Trunk",
        subtitle: "802.1Q Isolated Tenant VLAN",
        meta: "PBAC Scoped",
        icon: ShieldCheck,
      },
    ],
    []
  );

  // ── Column 5: End Subscriber (Equivalent to "YOUR MAC" in Bridgeplay) ──────
  const col5Node: NodeItem = useMemo(
    () => ({
      id: "customer-ont",
      title: "Customer ONT",
      subtitle: `${tenantName} GPON WiFi 6`,
      meta: `${rxPowerDbm} dBm • ${realtimeLatencyMs}ms`,
      icon: Wifi,
    }),
    [tenantName, rxPowerDbm, realtimeLatencyMs]
  );

  // ── Precision Bézier Optical Fiber Cables & Hollow Pin Connectors ─────────
  // Canvas coordinate space: 980 x 360 px
  const cables: CablePath[] = useMemo(
    () => [
      // 1. From Col 1 -> Center Hero Card inputs
      {
        id: "c-ixp-hero",
        fromId: "ixp-upstream",
        toId: "hero-olt",
        x1: 170,
        y1: 94,
        x2: 240,
        y2: 80,
      },
      {
        id: "c-bgp-hero",
        fromId: "bgp-router",
        toId: "hero-olt",
        x1: 170,
        y1: 184,
        x2: 240,
        y2: 145,
      },

      // 2. From Center Hero Card outputs -> Col 3 ODN
      {
        id: "c-hero-odf",
        fromId: "hero-olt",
        toId: "odf-bay",
        x1: 420,
        y1: 75,
        x2: 485,
        y2: 74,
      },
      {
        id: "c-hero-fdt",
        fromId: "hero-olt",
        toId: "fdt-cabinet",
        x1: 420,
        y1: 115,
        x2: 485,
        y2: 154,
      },
      {
        id: "c-hero-fat",
        fromId: "hero-olt",
        toId: "fat-pole",
        x1: 420,
        y1: 155,
        x2: 485,
        y2: 234,
      },

      // 3. From Col 3 ODN -> Col 4 Services
      {
        id: "c-odf-net",
        fromId: "odf-bay",
        toId: "svc-internet",
        x1: 635,
        y1: 74,
        x2: 700,
        y2: 46,
      },
      {
        id: "c-fdt-iptv",
        fromId: "fdt-cabinet",
        toId: "svc-iptv",
        x1: 635,
        y1: 154,
        x2: 700,
        y2: 122,
      },
      {
        id: "c-fdt-voip",
        fromId: "fdt-cabinet",
        toId: "svc-voip",
        x1: 635,
        y1: 154,
        x2: 700,
        y2: 198,
      },
      {
        id: "c-fat-vlan",
        fromId: "fat-pole",
        toId: "svc-vlan",
        x1: 635,
        y1: 234,
        x2: 700,
        y2: 274,
      },

      // 4. From Col 4 Services -> Col 5 Customer ONT
      {
        id: "c-net-ont",
        fromId: "svc-internet",
        toId: "customer-ont",
        x1: 850,
        y1: 46,
        x2: 910,
        y2: 145,
      },
      {
        id: "c-iptv-ont",
        fromId: "svc-iptv",
        toId: "customer-ont",
        x1: 850,
        y1: 122,
        x2: 910,
        y2: 155,
      },
      {
        id: "c-voip-ont",
        fromId: "svc-voip",
        toId: "customer-ont",
        x1: 850,
        y1: 198,
        x2: 910,
        y2: 165,
      },
      {
        id: "c-vlan-ont",
        fromId: "svc-vlan",
        toId: "customer-ont",
        x1: 850,
        y1: 274,
        x2: 910,
        y2: 175,
      },
    ],
    []
  );

  // Helper to determine active connection
  const isCableActive = (cable: CablePath) => {
    if (!hoveredNode) return false;
    if (cable.fromId === hoveredNode || cable.toId === hoveredNode) return true;
    if (hoveredNode === "hero-olt") return true;
    return false;
  };

  // ── GSAP Initial Staggered Mount Timeline & Ambient Idle Motion ───────────
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial configuration of states
      gsap.set(".topology-header-badge", { opacity: 0, y: -8 });
      gsap.set(".topology-col1-node", { opacity: 0, x: -24 });
      if (heroCardRef.current) {
        gsap.set(heroCardRef.current, { opacity: 0, scale: 0.9, y: 15 });
      }
      gsap.set(".topology-hero-spec-item", { opacity: 0, x: -8 });
      gsap.set(".topology-cable-base", { opacity: 0 });
      gsap.set(".topology-cable-pulse", { opacity: 0 });
      gsap.set(".topology-cable-pin", { scale: 0, transformOrigin: "center center" });
      gsap.set(".topology-col3-node", { opacity: 0, y: 16 });
      gsap.set(".topology-col4-node", { opacity: 0, y: 16 });
      gsap.set(".topology-col5-node", { opacity: 0, x: 24 });

      // 2. Staggered Orchestrated Entrance
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.to(".topology-header-badge", {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
      })
        .to(
          ".topology-col1-node",
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.2"
        );

      if (heroCardRef.current) {
        tl.to(
          heroCardRef.current,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            ease: "back.out(1.4)",
          },
          "-=0.3"
        );
      }

      tl.to(
        ".topology-hero-spec-item",
        {
          opacity: 1,
          x: 0,
          duration: 0.35,
          stagger: 0.05,
        },
        "-=0.3"
      )
        .to(
          ".topology-cable-base",
          {
            opacity: 0.85,
            duration: 0.45,
            stagger: 0.02,
          },
          "-=0.35"
        )
        .to(
          ".topology-cable-pin",
          {
            scale: 1,
            duration: 0.35,
            stagger: 0.015,
            ease: "back.out(2)",
          },
          "-=0.3"
        )
        .to(
          ".topology-col3-node",
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.07,
          },
          "-=0.35"
        )
        .to(
          ".topology-col4-node",
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.06,
          },
          "-=0.3"
        )
        .to(
          ".topology-col5-node",
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
          },
          "-=0.25"
        )
        .to(
          ".topology-cable-pulse",
          {
            opacity: 0.75,
            duration: 0.4,
          },
          "-=0.2"
        );

      // 3. Continuous Optical Light Stream Animation (Infinite smooth loop)
      gsap.to(".topology-cable-pulse", {
        strokeDashoffset: -40,
        duration: 1.5,
        repeat: -1,
        ease: "none",
      });

      // 4. Subtle ambient floating breathing motion on Hero card
      if (heroCardRef.current) {
        gsap.to(heroCardRef.current, {
          y: "-=3",
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.2,
        });
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  // ── GSAP Interactive Node & Cable Highlight Transitions ───────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const allCards = containerRef.current?.querySelectorAll<HTMLElement>(".topology-node-card");
      if (!allCards) return;

      if (!hoveredNode) {
        // Reset all node cards to full normal opacity and natural scale
        gsap.to(allCards, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });

        // Reset all cables
        gsap.to(".topology-cable-base", {
          opacity: 0.45,
          strokeWidth: 1.1,
          duration: 0.3,
          overwrite: "auto",
        });
        gsap.to(".topology-cable-pulse", {
          opacity: 0.65,
          strokeWidth: 1.4,
          duration: 0.3,
          overwrite: "auto",
        });
        gsap.to(".topology-cable-pin", {
          scale: 1,
          duration: 0.3,
          overwrite: "auto",
        });
        return;
      }

      // Active Node Hover State:
      allCards.forEach((card) => {
        const cardId = card.getAttribute("data-node-id");
        const isTarget = cardId === hoveredNode;
        const isConnected =
          hoveredNode === "hero-olt" ||
          cables.some(
            (c) =>
              (c.fromId === hoveredNode && c.toId === cardId) ||
              (c.toId === hoveredNode && c.fromId === cardId)
          );

        if (isTarget) {
          gsap.to(card, {
            scale: 1.03,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else if (isConnected) {
          gsap.to(card, {
            scale: 1.01,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(card, {
            scale: 0.98,
            opacity: 0.25,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      });

      // Highlight active Bézier cables and dim background cables
      cables.forEach((cable) => {
        const active = isCableActive(cable);
        const baseEl = containerRef.current?.querySelector(`.cable-base-${cable.id}`);
        const pulseEl = containerRef.current?.querySelector(`.cable-pulse-${cable.id}`);
        const pin1El = containerRef.current?.querySelector(`.cable-pin-from-${cable.id}`);
        const pin2El = containerRef.current?.querySelector(`.cable-pin-to-${cable.id}`);

        if (active) {
          if (baseEl) {
            gsap.to(baseEl, {
              opacity: 1,
              strokeWidth: 2.0,
              duration: 0.25,
              overwrite: "auto",
            });
          }
          if (pulseEl) {
            gsap.to(pulseEl, {
              opacity: 1,
              strokeWidth: 2.6,
              duration: 0.25,
              overwrite: "auto",
            });
          }
          if (pin1El) {
            gsap.to(pin1El, {
              scale: 1.35,
              duration: 0.25,
              overwrite: "auto",
            });
          }
          if (pin2El) {
            gsap.to(pin2El, {
              scale: 1.35,
              duration: 0.25,
              overwrite: "auto",
            });
          }
        } else {
          if (baseEl) {
            gsap.to(baseEl, {
              opacity: 0.12,
              strokeWidth: 0.9,
              duration: 0.3,
              overwrite: "auto",
            });
          }
          if (pulseEl) {
            gsap.to(pulseEl, {
              opacity: 0.08,
              duration: 0.3,
              overwrite: "auto",
            });
          }
          if (pin1El) {
            gsap.to(pin1El, {
              scale: 0.8,
              duration: 0.3,
              overwrite: "auto",
            });
          }
          if (pin2El) {
            gsap.to(pin2El, {
              scale: 0.8,
              duration: 0.3,
              overwrite: "auto",
            });
          }
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [hoveredNode, cables]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-[1040px] mx-auto select-none font-sans text-foreground overflow-visible py-4",
        className
      )}
    >
      {/* ── Top Micro-Status Ribbon (Monochrome Enterprise Standard) ────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 topology-header-badge">
          <span className="size-2 rounded-full bg-foreground shadow-xs animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-foreground">
            FTTH OPTICAL & PHYSICAL NETWORK TOPOLOGY
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="topology-header-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/80 bg-muted/60 text-[10px] font-mono text-muted-foreground shadow-xs">
            <Zap className="size-3 text-foreground" />
            <span>Latency: {realtimeLatencyMs}ms</span>
          </div>

          <div className="topology-header-badge inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/80 bg-muted/60 text-[10px] font-mono text-foreground font-semibold shadow-xs">
            <span className="size-1.5 rounded-full bg-foreground" />
            <span>Signal: {rxPowerDbm} dBm (Optimal)</span>
          </div>
        </div>
      </div>

      {/* ── Relative Viewport Canvas (Exact 980 x 360 Ratio matching Bridgeplay) ── */}
      <div className="relative w-full h-[360px] overflow-visible">
        {/* ── SVG Curved Optical Fiber Connectors with Hollow Terminal Pins ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          viewBox="0 0 980 360"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Subtle glow filter for active path illumination */}
            <filter id="monochromeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {cables.map((cable) => {
            const active = isCableActive(cable);
            const dx = Math.abs(cable.x2 - cable.x1) * 0.55;
            const pathD = `M ${cable.x1} ${cable.y1} C ${cable.x1 + dx} ${cable.y1}, ${cable.x2 - dx} ${cable.y2}, ${cable.x2} ${cable.y2}`;

            return (
              <g key={cable.id}>
                {/* 1. Base Thin Cable Seam (Hairline neutral wire matching Bridgeplay) */}
                <path
                  d={pathD}
                  stroke="currentColor"
                  strokeWidth="1.1"
                  className={cn(
                    "topology-cable-base",
                    `cable-base-${cable.id}`,
                    active
                      ? "text-foreground opacity-90"
                      : "text-muted-foreground/35 opacity-45 dark:opacity-35"
                  )}
                />

                {/* 2. Animated Flowing Data Pulse (Monochrome light pulse along curve) */}
                <path
                  d={pathD}
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeDasharray="4 16"
                  className={cn(
                    "topology-cable-pulse",
                    `cable-pulse-${cable.id}`,
                    active
                      ? "text-foreground opacity-100"
                      : "text-muted-foreground opacity-60 dark:opacity-65"
                  )}
                  style={{
                    filter: active ? "url(#monochromeGlow)" : undefined,
                  }}
                />

                {/* 3. Terminal Hollow Pins at cable ends (Exact match to Bridgeplay circle ports) */}
                <circle
                  cx={cable.x1}
                  cy={cable.y1}
                  r="3.5"
                  className={cn(
                    "topology-cable-pin",
                    `cable-pin-from-${cable.id}`,
                    active
                      ? "fill-background stroke-foreground stroke-2"
                      : "fill-background stroke-muted-foreground/60 stroke-[1.2]"
                  )}
                />
                <circle
                  cx={cable.x2}
                  cy={cable.y2}
                  r="3.5"
                  className={cn(
                    "topology-cable-pin",
                    `cable-pin-to-${cable.id}`,
                    active
                      ? "fill-background stroke-foreground stroke-2"
                      : "fill-background stroke-muted-foreground/60 stroke-[1.2]"
                  )}
                />
              </g>
            );
          })}
        </svg>

        {/* ── HTML Node Cards Layer (Identical 5-Column Grid Anatomy) ───────── */}
        <div className="absolute inset-0 flex justify-between items-start z-10 pointer-events-none px-1">
          {/* ── 1. COLUMN 1: STEAM / BACKBONE UPLINK (Left) ── */}
          <div className="flex flex-col w-[160px] pt-4 space-y-4">
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1">
              BACKBONE
            </span>
            <div className="space-y-3.5 pointer-events-auto">
              {col1Nodes.map((n) => (
                <div key={n.id} className="topology-col1-node">
                  <NodeCard
                    node={n}
                    isHovered={hoveredNode === n.id}
                    isDimmed={Boolean(hoveredNode && hoveredNode !== n.id && hoveredNode !== "hero-olt")}
                    onHover={(h) => interactive && setHoveredNode(h ? n.id : null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. COLUMN 2: CENTER HERO CARD (Bridgeplay equivalent) ── */}
          <div className="flex flex-col items-center w-[185px] -mt-1 pointer-events-auto">
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pb-1.5">
              FTTH CORE
            </span>

            {/* Dominant Hero Card with Subtle Inset Rim Glow */}
            <div
              ref={heroCardRef}
              data-node-id="hero-olt"
              onMouseEnter={() => interactive && setHoveredNode("hero-olt")}
              onMouseLeave={() => interactive && setHoveredNode(null)}
              className={cn(
                "topology-node-card group relative w-full rounded-2xl p-4 cursor-pointer text-center",
                "bg-[#111115] dark:bg-[#0c0c0f] border border-white/20 dark:border-white/25",
                "shadow-[0_0_28px_rgba(255,255,255,0.06)] hover:shadow-[0_0_36px_rgba(255,255,255,0.12)]",
                hoveredNode === "hero-olt" && "border-foreground/80"
              )}
            >
              {/* Top Hero Icon Badge */}
              <div className="size-9 rounded-xl bg-muted/80 border border-border/80 flex items-center justify-center text-foreground mx-auto mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <Cpu className="size-5" />
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-foreground tracking-tight mb-1 font-sans">
                Core OLT Engine
              </h3>
              <p className="text-[10px] text-muted-foreground leading-tight mb-2.5 font-mono px-0.5">
                FTTH Aggregation, provision & telemetry
              </p>

              {/* License/Status Badge at Bottom of Card */}
              <span className="inline-block text-[9px] font-mono text-muted-foreground/90 bg-muted/70 border border-border/60 px-2 py-0.5 rounded font-medium">
                GPON-XGS • 2.5G
              </span>
            </div>

            {/* Exact "BUILT ON" Micro-Specification Stack underneath */}
            <div className="w-full mt-3 px-1 text-left space-y-1 font-mono text-[9px]">
              <span className="text-[9px] font-bold text-muted-foreground/60 tracking-wider uppercase block">
                BUILT ON
              </span>
              <div className="topology-hero-spec-item flex justify-between text-muted-foreground hover:text-foreground transition-colors">
                <span>ZTE & Huawei Core</span>
                <span className="text-muted-foreground/75">SNMP-v3</span>
              </div>
              <div className="topology-hero-spec-item flex justify-between text-muted-foreground hover:text-foreground transition-colors">
                <span>PostGIS 3.5 pgRouting</span>
                <span className="text-muted-foreground/75">GeoTracer</span>
              </div>
              <div className="topology-hero-spec-item flex justify-between text-muted-foreground hover:text-foreground transition-colors">
                <span>14 Polyglot Gateways</span>
                <span className="text-muted-foreground/75">Go/FastAPI</span>
              </div>
              <div className="topology-hero-spec-item flex justify-between text-muted-foreground hover:text-foreground transition-colors">
                <span>Telemetry Daemon</span>
                <span className="text-muted-foreground/75">1-Sec Ping</span>
              </div>
            </div>
          </div>

          {/* ── 3. COLUMN 3: ENGINES / PASSIVE ODN (Middle Right) ── */}
          <div className="flex flex-col w-[150px] pt-4 space-y-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1">
              PASSIVE ODN
            </span>
            <div className="space-y-2.5 pointer-events-auto">
              {col3Nodes.map((n) => (
                <div key={n.id} className="topology-col3-node">
                  <NodeCard
                    node={n}
                    isHovered={hoveredNode === n.id}
                    isDimmed={Boolean(hoveredNode && hoveredNode !== n.id && hoveredNode !== "hero-olt")}
                    onHover={(h) => interactive && setHoveredNode(h ? n.id : null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. COLUMN 4: GRAPHICS / SERVICES (Right) ── */}
          <div className="flex flex-col w-[150px] pt-0.5 space-y-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1">
              SERVICES
            </span>
            <div className="space-y-2 pointer-events-auto">
              {col4Nodes.map((n) => (
                <div key={n.id} className="topology-col4-node">
                  <NodeCard
                    node={n}
                    isHovered={hoveredNode === n.id}
                    isDimmed={Boolean(hoveredNode && hoveredNode !== n.id && hoveredNode !== "hero-olt")}
                    onHover={(h) => interactive && setHoveredNode(h ? n.id : null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. COLUMN 5: YOUR MAC / END SUBSCRIBER (Far Right) ── */}
          <div className="flex flex-col w-[140px] pt-14 space-y-2.5">
            <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1">
              SUBSCRIBER
            </span>
            <div className="pointer-events-auto topology-col5-node">
              <NodeCard
                node={col5Node}
                isHovered={hoveredNode === col5Node.id}
                isDimmed={Boolean(hoveredNode && hoveredNode !== col5Node.id && hoveredNode !== "hero-olt")}
                onHover={(h) => interactive && setHoveredNode(h ? col5Node.id : null)}
                highlightBadge
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Monochromatic Node Card (Exact Match to Bridgeplay Item Cards) ─
function NodeCard({
  node,
  isHovered,
  isDimmed,
  onHover,
  highlightBadge = false,
}: {
  node: NodeItem;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: (hovered: boolean) => void;
  highlightBadge?: boolean;
}) {
  return (
    <div
      data-node-id={node.id}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "topology-node-card group relative w-full rounded-xl p-2.5 cursor-pointer",
        "bg-[#0f0f13]/90 dark:bg-[#0a0a0d]/90 border shadow-xs",
        isHovered
          ? "border-foreground/80 bg-accent/30 shadow-sm"
          : isDimmed
          ? "opacity-35 border-border/40"
          : "border-border/70 hover:border-foreground/40 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <h4 className="text-xs font-semibold text-foreground tracking-tight truncate font-sans">
          {node.title}
        </h4>
      </div>

      <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 mb-1.5 font-mono">
        {node.subtitle}
      </p>

      <div className="flex items-center justify-end">
        <span
          className={cn(
            "text-[9px] font-mono px-1 py-0.2 rounded border",
            highlightBadge || isHovered
              ? "bg-foreground/10 text-foreground border-foreground/30 font-semibold"
              : "text-muted-foreground/70 border-border/40 bg-muted/40"
          )}
        >
          {node.meta}
        </span>
      </div>
    </div>
  );
}
