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

interface PrecisionCable {
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
  const [scaleFactor, setScaleFactor] = useState(1);

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

  // ── Mathematically Aligned 1040 x 340 Pixel-Perfect Cable Connections ─────
  // Every column gap is equidistant (70px) and every port sits exactly on the pin.
  const cables: PrecisionCable[] = useMemo(
    () => [
      // 1. Col 1 (Backbone) -> Col 2 (Core OLT Hero)
      {
        id: "c-ixp-hero",
        fromId: "ixp-upstream",
        toId: "hero-olt",
        x1: 165,
        y1: 105,
        x2: 235,
        y2: 105, // Perfectly horizontal!
      },
      {
        id: "c-bgp-hero",
        fromId: "bgp-router",
        toId: "hero-olt",
        x1: 165,
        y1: 205,
        x2: 235,
        y2: 175, // Smooth 30px S-curve!
      },

      // 2. Col 2 (Core OLT Hero) -> Col 3 (Passive ODN)
      {
        id: "c-hero-odf",
        fromId: "hero-olt",
        toId: "odf-bay",
        x1: 430,
        y1: 75,
        x2: 505,
        y2: 75, // Perfectly horizontal!
      },
      {
        id: "c-hero-fdt",
        fromId: "hero-olt",
        toId: "fdt-cabinet",
        x1: 430,
        y1: 135,
        x2: 505,
        y2: 145, // Gentle 10px S-curve!
      },
      {
        id: "c-hero-fat",
        fromId: "hero-olt",
        toId: "fat-pole",
        x1: 430,
        y1: 195,
        x2: 505,
        y2: 215, // Gentle 20px S-curve!
      },

      // 3. Col 3 (Passive ODN) -> Col 4 (Services)
      {
        id: "c-odf-net",
        fromId: "odf-bay",
        toId: "svc-internet",
        x1: 655,
        y1: 75,
        x2: 725,
        y2: 57,
      },
      {
        id: "c-fdt-iptv",
        fromId: "fdt-cabinet",
        toId: "svc-iptv",
        x1: 655,
        y1: 135,
        x2: 725,
        y2: 121,
      },
      {
        id: "c-fdt-voip",
        fromId: "fdt-cabinet",
        toId: "svc-voip",
        x1: 655,
        y1: 155,
        x2: 725,
        y2: 185,
      },
      {
        id: "c-fat-vlan",
        fromId: "fat-pole",
        toId: "svc-vlan",
        x1: 655,
        y1: 215,
        x2: 725,
        y2: 249,
      },

      // 4. Col 4 (Services) -> Col 5 (Customer ONT)
      {
        id: "c-net-ont",
        fromId: "svc-internet",
        toId: "customer-ont",
        x1: 875,
        y1: 57,
        x2: 945,
        y2: 118,
      },
      {
        id: "c-iptv-ont",
        fromId: "svc-iptv",
        toId: "customer-ont",
        x1: 875,
        y1: 121,
        x2: 945,
        y2: 135,
      },
      {
        id: "c-voip-ont",
        fromId: "svc-voip",
        toId: "customer-ont",
        x1: 875,
        y1: 185,
        x2: 945,
        y2: 152,
      },
      {
        id: "c-vlan-ont",
        fromId: "svc-vlan",
        toId: "customer-ont",
        x1: 875,
        y1: 249,
        x2: 945,
        y2: 169,
      },
    ],
    []
  );

  // Responsive Auto-Scaling (Always preserves exact pixel grid, scales to container)
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const available = containerRef.current.clientWidth;
      const target = 1040;
      if (available < target) {
        setScaleFactor(Math.max(0.68, available / target));
      } else {
        setScaleFactor(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
  }, []);

  // Helper to determine active connection
  const isCableActive = (cable: PrecisionCable) => {
    if (!hoveredNode) return false;
    if (cable.fromId === hoveredNode || cable.toId === hoveredNode) return true;
    if (hoveredNode === "hero-olt") return true;
    return false;
  };

  // ── GSAP Initial Staggered Mount Timeline & Ambient Idle Motion ───────────
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial setup of states
      gsap.set(".topology-badge-item", { opacity: 0, y: -8 });
      gsap.set(".topology-col1-node", { opacity: 0, x: -18 });
      if (heroCardRef.current) {
        gsap.set(heroCardRef.current, { opacity: 0, scale: 0.92, y: 12 });
      }
      gsap.set(".topology-hero-spec-item", { opacity: 0, x: -6 });
      gsap.set(".topology-cable-base", { opacity: 0 });
      gsap.set(".topology-cable-pulse", { opacity: 0 });
      gsap.set(".topology-cable-pin", { scale: 0, transformOrigin: "center center" });
      gsap.set(".topology-col3-node", { opacity: 0, y: 14 });
      gsap.set(".topology-col4-node", { opacity: 0, y: 14 });
      gsap.set(".topology-col5-node", { opacity: 0, x: 18 });

      // 2. Staggered Orchestrated Entrance
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.to(".topology-badge-item", {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.08,
      })
        .to(
          ".topology-col1-node",
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
            stagger: 0.08,
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
            duration: 0.6,
            ease: "back.out(1.4)",
          },
          "-=0.25"
        );
      }

      tl.to(
        ".topology-hero-spec-item",
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.04,
        },
        "-=0.25"
      )
        .to(
          ".topology-cable-base",
          {
            opacity: 0.85,
            duration: 0.4,
            stagger: 0.02,
          },
          "-=0.3"
        )
        .to(
          ".topology-cable-pin",
          {
            scale: 1,
            duration: 0.3,
            stagger: 0.015,
            ease: "back.out(2)",
          },
          "-=0.25"
        )
        .to(
          ".topology-col3-node",
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.06,
          },
          "-=0.3"
        )
        .to(
          ".topology-col4-node",
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.05,
          },
          "-=0.25"
        )
        .to(
          ".topology-col5-node",
          {
            opacity: 1,
            x: 0,
            duration: 0.45,
          },
          "-=0.2"
        )
        .to(
          ".topology-cable-pulse",
          {
            opacity: 0.75,
            duration: 0.35,
          },
          "-=0.2"
        );

      // 3. Continuous Optical Light Stream Animation (Infinite smooth loop)
      gsap.to(".topology-cable-pulse", {
        strokeDashoffset: -40,
        duration: 1.4,
        repeat: -1,
        ease: "none",
      });

      // 4. Subtle ambient floating breathing motion on Hero card
      if (heroCardRef.current) {
        gsap.to(heroCardRef.current, {
          y: "-=2.5",
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-[1060px] mx-auto select-none font-sans text-foreground overflow-visible py-2",
        className
      )}
    >
      {/* ── Top Micro-Status Ribbon (Monochrome Enterprise Standard) ────────── */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 topology-badge-item">
          <span className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
          <span className="text-[10.5px] font-mono font-bold tracking-wider uppercase text-foreground">
            FTTH OPTICAL & PHYSICAL NETWORK TOPOLOGY
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="topology-badge-item inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/80 bg-muted/60 text-[9.5px] font-mono text-muted-foreground shadow-xs">
            <Zap className="size-3 text-cyan-400" />
            <span>Latency: {realtimeLatencyMs}ms</span>
          </div>

          <div className="topology-badge-item inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border/80 bg-muted/60 text-[9.5px] font-mono text-foreground font-semibold shadow-xs">
            <span className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
            <span>Signal: {rxPowerDbm} dBm (Optimal)</span>
          </div>
        </div>
      </div>

      {/* ── Scaled Reference Canvas (Always 1040 x 340, scaled cleanly) ──────── */}
      <div
        className="w-full flex justify-center overflow-visible"
        style={{ height: `${340 * scaleFactor}px` }}
      >
        <div
          style={{
            width: "1040px",
            height: "340px",
            transform: `scale(${scaleFactor})`,
            transformOrigin: "top center",
          }}
          className="relative select-none overflow-visible"
        >
          {/* ── SVG Curved Optical Fiber Connectors with Multi-Color Glow ───────── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
            viewBox="0 0 1040 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Bridgeplay-style Multi-Color Neon Gradient for Active Paths */}
              <linearGradient id="bridgeplayNeon" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#6366f1" />
                <stop offset="70%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>

              {/* Glowing Blur Filter for Active Illumination */}
              <filter id="neonBeamGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {cables.map((cable) => {
              const active = isCableActive(cable);
              const dx = (cable.x2 - cable.x1) * 0.52;
              const pathD = `M ${cable.x1} ${cable.y1} C ${cable.x1 + dx} ${cable.y1}, ${cable.x2 - dx} ${cable.y2}, ${cable.x2} ${cable.y2}`;

              return (
                <g key={cable.id} className="transition-all duration-300">
                  {/* 1. Base Thin Cable Seam */}
                  <path
                    d={pathD}
                    stroke={active ? "url(#bridgeplayNeon)" : "currentColor"}
                    strokeWidth={active ? "2.2" : "1.1"}
                    className={cn(
                      "topology-cable-base transition-all duration-300",
                      active
                        ? "opacity-100"
                        : "text-muted-foreground/35 opacity-40 dark:opacity-30"
                    )}
                    style={{
                      filter: active ? "url(#neonBeamGlow)" : undefined,
                    }}
                  />

                  {/* 2. Animated Flowing Data Pulse */}
                  <path
                    d={pathD}
                    stroke={active ? "#ffffff" : "currentColor"}
                    strokeWidth={active ? "2.4" : "1.4"}
                    strokeDasharray="4 16"
                    className={cn(
                      "topology-cable-pulse transition-opacity duration-300",
                      active
                        ? "opacity-100"
                        : "text-muted-foreground opacity-55 dark:opacity-60"
                    )}
                  />

                  {/* 3. Terminal Hollow Pins at cable ends */}
                  <circle
                    cx={cable.x1}
                    cy={cable.y1}
                    r={active ? "4" : "3.5"}
                    className="topology-cable-pin transition-all duration-300"
                    style={{
                      fill: active ? "#0b0c14" : "var(--background)",
                      stroke: active ? "#38bdf8" : "rgba(255,255,255,0.4)",
                      strokeWidth: active ? "2.2" : "1.2",
                      filter: active
                        ? "drop-shadow(0 0 6px rgba(56,189,248,0.8))"
                        : undefined,
                    }}
                  />
                  <circle
                    cx={cable.x2}
                    cy={cable.y2}
                    r={active ? "4" : "3.5"}
                    className="topology-cable-pin transition-all duration-300"
                    style={{
                      fill: active ? "#0b0c14" : "var(--background)",
                      stroke: active ? "#a855f7" : "rgba(255,255,255,0.4)",
                      strokeWidth: active ? "2.2" : "1.2",
                      filter: active
                        ? "drop-shadow(0 0 6px rgba(168,85,247,0.8))"
                        : undefined,
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* ── HTML Node Cards Layer (Pixel-Exact Absolute Placement) ───────── */}

          {/* ── 1. COLUMN 1: STEAM / BACKBONE UPLINK (x = 10, w = 155) ── */}
          <div
            style={{ left: "10px", width: "155px" }}
            className="absolute top-0 bottom-0 flex flex-col justify-center pointer-events-none"
          >
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-2">
              BACKBONE
            </span>
            <div className="space-y-4 pointer-events-auto">
              <div className="topology-col1-node">
                <TactileNodeCard
                  node={col1Nodes[0]}
                  isHovered={hoveredNode === col1Nodes[0].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col1Nodes[0].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col1Nodes[0].id : null)}
                />
              </div>

              <div className="topology-col1-node">
                <TactileNodeCard
                  node={col1Nodes[1]}
                  isHovered={hoveredNode === col1Nodes[1].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col1Nodes[1].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col1Nodes[1].id : null)}
                />
              </div>
            </div>
          </div>

          {/* ── 2. COLUMN 2: CENTER HERO CARD (x = 235, w = 195) ── */}
          <div
            style={{ left: "235px", width: "195px" }}
            className="absolute top-0 bottom-0 flex flex-col items-center justify-center pointer-events-auto"
          >
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pb-1.5">
              FTTH CORE
            </span>

            {/* Dominant Hero Card with Multi-Color Neon Glowing Rim */}
            <div
              ref={heroCardRef}
              onMouseEnter={() => interactive && setHoveredNode("hero-olt")}
              onMouseLeave={() => interactive && setHoveredNode(null)}
              className={cn(
                "group relative w-full rounded-2xl p-4 text-center cursor-pointer transition-all duration-300",
                "bg-[#0d0d14]/95 text-foreground border border-transparent",
                hoveredNode === "hero-olt"
                  ? "shadow-[0_0_40px_rgba(99,102,241,0.55),0_0_20px_rgba(56,189,248,0.4)] scale-[1.02]"
                  : "shadow-[0_0_28px_rgba(99,102,241,0.3)] hover:shadow-[0_0_36px_rgba(99,102,241,0.45)]"
              )}
              style={{
                background:
                  "linear-gradient(#0c0d14, #0c0d14) padding-box, linear-gradient(135deg, #38bdf8 0%, #6366f1 35%, #a855f7 70%, #ec4899 100%) border-box",
                borderWidth: "1.5px",
                borderStyle: "solid",
              }}
            >
              {/* Top Hero Icon Badge */}
              <div className="size-9 rounded-xl bg-muted/80 border border-border/80 flex items-center justify-center text-foreground mx-auto mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <Cpu className="size-5 text-cyan-400" />
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-foreground tracking-tight mb-0.5 font-sans">
                Core OLT Engine
              </h3>
              <p className="text-[9.5px] text-muted-foreground leading-tight mb-2.5 font-mono px-0.5">
                FTTH Aggregation, provision & telemetry
              </p>

              {/* License/Status Badge at Bottom of Card */}
              <span className="inline-block text-[8.5px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-2 py-0.5 rounded font-medium shadow-xs">
                GPON-XGS • 2.5G
              </span>
            </div>

            {/* Exact "BUILT ON" Micro-Specification Stack underneath */}
            <div className="w-full mt-2.5 px-1 text-left space-y-1 font-mono text-[8.5px]">
              <span className="text-[8.5px] font-bold text-muted-foreground/60 tracking-wider uppercase block">
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

          {/* ── 3. COLUMN 3: ENGINES / PASSIVE ODN (x = 505, w = 150) ── */}
          <div
            style={{ left: "505px", width: "150px" }}
            className="absolute top-0 bottom-0 flex flex-col justify-center pointer-events-none"
          >
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-2">
              PASSIVE ODN
            </span>
            <div className="space-y-3 pointer-events-auto">
              {col3Nodes.map((n) => (
                <div key={n.id} className="topology-col3-node">
                  <TactileNodeCard
                    node={n}
                    isHovered={hoveredNode === n.id}
                    isDimmed={Boolean(hoveredNode && hoveredNode !== n.id && hoveredNode !== "hero-olt")}
                    onHover={(h) => interactive && setHoveredNode(h ? n.id : null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. COLUMN 4: GRAPHICS / SERVICES (x = 725, w = 150) ── */}
          <div
            style={{ left: "725px", width: "150px" }}
            className="absolute top-0 bottom-0 flex flex-col justify-center pointer-events-none"
          >
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-1.5">
              SERVICES
            </span>
            <div className="space-y-2 pointer-events-auto">
              {col4Nodes.map((n) => (
                <div key={n.id} className="topology-col4-node">
                  <TactileNodeCard
                    node={n}
                    isHovered={hoveredNode === n.id}
                    isDimmed={Boolean(hoveredNode && hoveredNode !== n.id && hoveredNode !== "hero-olt")}
                    onHover={(h) => interactive && setHoveredNode(h ? n.id : null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. COLUMN 5: YOUR MAC / END SUBSCRIBER (x = 945, w = 145) ── */}
          <div
            style={{ left: "945px", width: "145px" }}
            className="absolute top-0 bottom-0 flex flex-col justify-center pointer-events-none"
          >
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-2">
              SUBSCRIBER
            </span>
            <div className="pointer-events-auto topology-col5-node">
              <TactileNodeCard
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

// ── Reusable Tactile Node Card with 3D Convex Bevel Highlight ───────────────
function TactileNodeCard({
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
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "group relative w-full rounded-xl px-2.5 py-1.5 cursor-pointer transition-all duration-200 border",
        isDimmed && "opacity-25 scale-[0.98]"
      )}
      style={{
        // 3D Convex Embossed Bevel: top white sheen fading to charcoal dark
        background: isHovered
          ? "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.035) 45%, rgba(14,14,20,0.98) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 35%, rgba(10,10,15,0.96) 100%)",
        boxShadow: isHovered
          ? "inset 0 1.5px 0 0 rgba(255,255,255,0.45), 0 0 16px -2px rgba(56,189,248,0.35), 0 8px 24px rgba(0,0,0,0.7)"
          : "inset 0 1px 0 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.45)",
        borderColor: isHovered ? "rgba(56,189,248,0.6)" : "rgba(255,255,255,0.12)",
        transform: isHovered ? "translateY(-1px) scale(1.02)" : "none",
      }}
    >
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <h4 className="text-[11px] font-semibold text-foreground tracking-tight truncate font-sans">
          {node.title}
        </h4>
      </div>

      <p className="text-[9.5px] text-muted-foreground leading-tight line-clamp-1 mb-1 font-mono">
        {node.subtitle}
      </p>

      <div className="flex items-center justify-end">
        <span
          className={cn(
            "text-[8.5px] font-mono px-1 py-0.2 rounded border transition-colors",
            highlightBadge || isHovered
              ? "bg-cyan-950/40 text-cyan-300 border-cyan-800/60 font-semibold"
              : "text-muted-foreground/70 border-white/10 bg-white/5"
          )}
        >
          {node.meta}
        </span>
      </div>
    </div>
  );
}
