"use client";

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
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

interface CableConnectionDef {
  id: string;
  fromId: string;
  toId: string;
  fromPin: string;
  toPin: string;
}

interface MeasuredPoint {
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
  const [cableCoords, setCableCoords] = useState<Record<string, MeasuredPoint>>({});

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

  // ── 11 Precision Cable Definitions Matching Image 3 Topology Flow ────────
  const cableDefs: CableConnectionDef[] = useMemo(
    () => [
      // 1. Col 1 -> Hero OLT
      {
        id: "c-ixp-hero",
        fromId: "ixp-upstream",
        toId: "hero-olt",
        fromPin: "out-ixp-upstream",
        toPin: "in-hero-0",
      },
      {
        id: "c-bgp-hero",
        fromId: "bgp-router",
        toId: "hero-olt",
        fromPin: "out-bgp-router",
        toPin: "in-hero-1",
      },

      // 2. Hero OLT -> Col 3 ODN
      {
        id: "c-hero-odf",
        fromId: "hero-olt",
        toId: "odf-bay",
        fromPin: "out-hero-0",
        toPin: "in-odf-bay",
      },
      {
        id: "c-hero-fdt",
        fromId: "hero-olt",
        toId: "fdt-cabinet",
        fromPin: "out-hero-1",
        toPin: "in-fdt-cabinet",
      },
      {
        id: "c-hero-fat",
        fromId: "hero-olt",
        toId: "fat-pole",
        fromPin: "out-hero-2",
        toPin: "in-fat-pole",
      },

      // 3. Col 3 ODN -> Col 4 Services
      {
        id: "c-odf-net",
        fromId: "odf-bay",
        toId: "svc-internet",
        fromPin: "out-odf-bay",
        toPin: "in-svc-internet",
      },
      {
        id: "c-fdt-iptv",
        fromId: "fdt-cabinet",
        toId: "svc-iptv",
        fromPin: "out-fdt-cabinet-0",
        toPin: "in-svc-iptv",
      },
      {
        id: "c-fdt-voip",
        fromId: "fdt-cabinet",
        toId: "svc-voip",
        fromPin: "out-fdt-cabinet-1",
        toPin: "in-svc-voip",
      },
      {
        id: "c-fat-vlan",
        fromId: "fat-pole",
        toId: "svc-vlan",
        fromPin: "out-fat-pole",
        toPin: "in-svc-vlan",
      },

      // 4. Col 4 Services -> Col 5 Subscriber ONT
      {
        id: "c-net-ont",
        fromId: "svc-internet",
        toId: "customer-ont",
        fromPin: "out-svc-internet",
        toPin: "in-ont-0",
      },
      {
        id: "c-iptv-ont",
        fromId: "svc-iptv",
        toId: "customer-ont",
        fromPin: "out-svc-iptv",
        toPin: "in-ont-1",
      },
      {
        id: "c-voip-ont",
        fromId: "svc-voip",
        toId: "customer-ont",
        fromPin: "out-svc-voip",
        toPin: "in-ont-2",
      },
      {
        id: "c-vlan-ont",
        fromId: "svc-vlan",
        toId: "customer-ont",
        fromPin: "out-svc-vlan",
        toPin: "in-ont-3",
      },
    ],
    []
  );

  // ── Dynamic Sub-Pixel DOM Measurement of Connecting Pins ────────────────
  const measureConnections = useCallback(() => {
    if (!containerRef.current) return;
    const canvasEl = containerRef.current.querySelector<HTMLElement>(".topology-canvas");
    if (!canvasEl) return;

    const canvasRect = canvasEl.getBoundingClientRect();
    const nextCoords: Record<string, MeasuredPoint> = {};

    cableDefs.forEach((def) => {
      const fromEl = containerRef.current?.querySelector<HTMLElement>(`[data-pin="${def.fromPin}"]`);
      const toEl = containerRef.current?.querySelector<HTMLElement>(`[data-pin="${def.toPin}"]`);

      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        nextCoords[def.id] = {
          x1: fromRect.left + fromRect.width / 2 - canvasRect.left,
          y1: fromRect.top + fromRect.height / 2 - canvasRect.top,
          x2: toRect.left + toRect.width / 2 - canvasRect.left,
          y2: toRect.top + toRect.height / 2 - canvasRect.top,
        };
      }
    });

    if (Object.keys(nextCoords).length > 0) {
      setCableCoords(nextCoords);
    }
  }, [cableDefs]);

  useLayoutEffect(() => {
    measureConnections();
    const timer = setTimeout(measureConnections, 50);
    const timer2 = setTimeout(measureConnections, 250);

    const resizeObserver = new ResizeObserver(() => {
      measureConnections();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", measureConnections);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureConnections);
    };
  }, [measureConnections]);

  // Helper to determine active connection
  const isCableActive = (cable: CableConnectionDef) => {
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
      gsap.set(".topology-col1-node", { opacity: 0, x: -20 });
      if (heroCardRef.current) {
        gsap.set(heroCardRef.current, { opacity: 0, scale: 0.9, y: 12 });
      }
      gsap.set(".topology-hero-spec-item", { opacity: 0, x: -6 });
      gsap.set(".topology-cable-base", { opacity: 0 });
      gsap.set(".topology-cable-pulse", { opacity: 0 });
      gsap.set(".topology-cable-pin", { scale: 0, transformOrigin: "center center" });
      gsap.set(".topology-col3-node", { opacity: 0, y: 14 });
      gsap.set(".topology-col4-node", { opacity: 0, y: 14 });
      gsap.set(".topology-col5-node", { opacity: 0, x: 20 });

      // 2. Staggered Orchestrated Entrance
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.to(".topology-header-badge", {
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
        duration: 1.5,
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
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });

        // Reset all cables
        gsap.to(".topology-cable-base", {
          opacity: 0.45,
          strokeWidth: 1.1,
          duration: 0.25,
          overwrite: "auto",
        });
        gsap.to(".topology-cable-pulse", {
          opacity: 0.65,
          strokeWidth: 1.4,
          duration: 0.25,
          overwrite: "auto",
        });
        gsap.to(".topology-cable-pin", {
          scale: 1,
          duration: 0.25,
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
          cableDefs.some(
            (c) =>
              (c.fromId === hoveredNode && c.toId === cardId) ||
              (c.toId === hoveredNode && c.fromId === cardId)
          );

        if (isTarget) {
          gsap.to(card, {
            scale: 1.03,
            opacity: 1,
            duration: 0.22,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else if (isConnected) {
          gsap.to(card, {
            scale: 1.01,
            opacity: 1,
            duration: 0.22,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(card, {
            scale: 0.98,
            opacity: 0.25,
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      });

      // Highlight active Bézier cables and dim background cables
      cableDefs.forEach((cable) => {
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
              duration: 0.22,
              overwrite: "auto",
            });
          }
          if (pulseEl) {
            gsap.to(pulseEl, {
              opacity: 1,
              strokeWidth: 2.5,
              duration: 0.22,
              overwrite: "auto",
            });
          }
          if (pin1El) {
            gsap.to(pin1El, {
              scale: 1.35,
              duration: 0.22,
              overwrite: "auto",
            });
          }
          if (pin2El) {
            gsap.to(pin2El, {
              scale: 1.35,
              duration: 0.22,
              overwrite: "auto",
            });
          }
        } else {
          if (baseEl) {
            gsap.to(baseEl, {
              opacity: 0.12,
              strokeWidth: 0.9,
              duration: 0.25,
              overwrite: "auto",
            });
          }
          if (pulseEl) {
            gsap.to(pulseEl, {
              opacity: 0.08,
              duration: 0.25,
              overwrite: "auto",
            });
          }
          if (pin1El) {
            gsap.to(pin1El, {
              scale: 0.8,
              duration: 0.25,
              overwrite: "auto",
            });
          }
          if (pin2El) {
            gsap.to(pin2El, {
              scale: 0.8,
              duration: 0.25,
              overwrite: "auto",
            });
          }
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [hoveredNode, cableDefs]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-[1000px] mx-auto select-none font-sans text-foreground overflow-visible py-2",
        className
      )}
    >
      {/* ── Top Micro-Status Ribbon (Monochrome Enterprise Standard) ────────── */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2 topology-header-badge">
          <span className="size-2 rounded-full bg-foreground shadow-xs animate-pulse" />
          <span className="text-[10.5px] font-mono font-bold tracking-wider uppercase text-foreground">
            FTTH OPTICAL & PHYSICAL NETWORK TOPOLOGY
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="topology-header-badge inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/80 bg-muted/60 text-[9.5px] font-mono text-muted-foreground shadow-xs">
            <Zap className="size-3 text-foreground" />
            <span>Latency: {realtimeLatencyMs}ms</span>
          </div>

          <div className="topology-header-badge inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/80 bg-muted/60 text-[9.5px] font-mono text-foreground font-semibold shadow-xs">
            <span className="size-1.5 rounded-full bg-foreground" />
            <span>Signal: {rxPowerDbm} dBm (Optimal)</span>
          </div>
        </div>
      </div>

      {/* ── Relative Viewport Canvas (Centered Vertical Alignment) ─────────── */}
      <div className="topology-canvas relative w-full h-[320px] overflow-visible">
        {/* ── SVG Curved Optical Fiber Connectors with Sub-Pixel Pins ───────── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="monochromeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {cableDefs.map((cable) => {
            const active = isCableActive(cable);
            const coords = cableCoords[cable.id];
            if (!coords) return null;

            const dx = Math.max(28, Math.abs(coords.x2 - coords.x1) * 0.52);
            const pathD = `M ${coords.x1} ${coords.y1} C ${coords.x1 + dx} ${coords.y1}, ${coords.x2 - dx} ${coords.y2}, ${coords.x2} ${coords.y2}`;

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

                {/* 3. Terminal Hollow Pins at cable ends (Sub-pixel perfect anchor) */}
                <circle
                  cx={coords.x1}
                  cy={coords.y1}
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
                  cx={coords.x2}
                  cy={coords.y2}
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

        {/* ── HTML Node Cards Layer (5 Balanced Centered Columns) ───────────── */}
        <div className="absolute inset-0 flex justify-between items-center z-10 pointer-events-none px-0.5">
          {/* ── 1. COLUMN 1: STEAM / BACKBONE UPLINK (Left) ── */}
          <div className="flex flex-col w-[150px] space-y-3 justify-center">
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-0.5">
              BACKBONE
            </span>
            <div className="space-y-2.5 pointer-events-auto">
              <div className="topology-col1-node">
                <NodeCard
                  node={col1Nodes[0]}
                  isHovered={hoveredNode === col1Nodes[0].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col1Nodes[0].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col1Nodes[0].id : null)}
                >
                  <span
                    data-pin="out-ixp-upstream"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                </NodeCard>
              </div>

              <div className="topology-col1-node">
                <NodeCard
                  node={col1Nodes[1]}
                  isHovered={hoveredNode === col1Nodes[1].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col1Nodes[1].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col1Nodes[1].id : null)}
                >
                  <span
                    data-pin="out-bgp-router"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                </NodeCard>
              </div>
            </div>
          </div>

          {/* ── 2. COLUMN 2: CENTER HERO CARD (Bridgeplay equivalent) ── */}
          <div className="flex flex-col items-center w-[180px] pointer-events-auto justify-center">
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pb-1.5">
              FTTH CORE
            </span>

            {/* Dominant Hero Card with Subtle Inset Rim Glow */}
            <div
              ref={heroCardRef}
              data-node-id="hero-olt"
              onMouseEnter={() => interactive && setHoveredNode("hero-olt")}
              onMouseLeave={() => interactive && setHoveredNode(null)}
              className={cn(
                "topology-node-card group relative w-full rounded-2xl p-3.5 cursor-pointer text-center",
                "bg-[#111115] dark:bg-[#0c0c0f] border border-white/20 dark:border-white/25",
                "shadow-[0_0_24px_rgba(255,255,255,0.06)] hover:shadow-[0_0_32px_rgba(255,255,255,0.12)]",
                hoveredNode === "hero-olt" && "border-foreground/80"
              )}
            >
              {/* Input Pins on Left */}
              <span
                data-pin="in-hero-0"
                className="absolute -left-1 top-[35%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
              />
              <span
                data-pin="in-hero-1"
                className="absolute -left-1 top-[65%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
              />

              {/* Output Pins on Right */}
              <span
                data-pin="out-hero-0"
                className="absolute -right-1 top-[25%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
              />
              <span
                data-pin="out-hero-1"
                className="absolute -right-1 top-[50%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
              />
              <span
                data-pin="out-hero-2"
                className="absolute -right-1 top-[75%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
              />

              {/* Top Hero Icon Badge */}
              <div className="size-8 rounded-xl bg-muted/80 border border-border/80 flex items-center justify-center text-foreground mx-auto mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <Cpu className="size-4" />
              </div>

              {/* Title & Description */}
              <h3 className="text-xs font-bold text-foreground tracking-tight mb-0.5 font-sans">
                Core OLT Engine
              </h3>
              <p className="text-[9.5px] text-muted-foreground leading-tight mb-2 font-mono px-0.5">
                FTTH Aggregation, provision & telemetry
              </p>

              {/* License/Status Badge at Bottom of Card */}
              <span className="inline-block text-[8.5px] font-mono text-muted-foreground/90 bg-muted/70 border border-border/60 px-1.5 py-0.5 rounded font-medium">
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

          {/* ── 3. COLUMN 3: ENGINES / PASSIVE ODN (Middle Right) ── */}
          <div className="flex flex-col w-[145px] space-y-2 justify-center">
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-0.5">
              PASSIVE ODN
            </span>
            <div className="space-y-2 pointer-events-auto">
              <div className="topology-col3-node">
                <NodeCard
                  node={col3Nodes[0]}
                  isHovered={hoveredNode === col3Nodes[0].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col3Nodes[0].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col3Nodes[0].id : null)}
                >
                  <span
                    data-pin="in-odf-bay"
                    className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                  <span
                    data-pin="out-odf-bay"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                </NodeCard>
              </div>

              <div className="topology-col3-node">
                <NodeCard
                  node={col3Nodes[1]}
                  isHovered={hoveredNode === col3Nodes[1].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col3Nodes[1].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col3Nodes[1].id : null)}
                >
                  <span
                    data-pin="in-fdt-cabinet"
                    className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                  <span
                    data-pin="out-fdt-cabinet-0"
                    className="absolute -right-1 top-[35%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                  <span
                    data-pin="out-fdt-cabinet-1"
                    className="absolute -right-1 top-[65%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                </NodeCard>
              </div>

              <div className="topology-col3-node">
                <NodeCard
                  node={col3Nodes[2]}
                  isHovered={hoveredNode === col3Nodes[2].id}
                  isDimmed={Boolean(hoveredNode && hoveredNode !== col3Nodes[2].id && hoveredNode !== "hero-olt")}
                  onHover={(h) => interactive && setHoveredNode(h ? col3Nodes[2].id : null)}
                >
                  <span
                    data-pin="in-fat-pole"
                    className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                  <span
                    data-pin="out-fat-pole"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                  />
                </NodeCard>
              </div>
            </div>
          </div>

          {/* ── 4. COLUMN 4: GRAPHICS / SERVICES (Right) ── */}
          <div className="flex flex-col w-[145px] space-y-1.5 justify-center">
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-0.5">
              SERVICES
            </span>
            <div className="space-y-1.5 pointer-events-auto">
              {col4Nodes.map((n) => (
                <div key={n.id} className="topology-col4-node">
                  <NodeCard
                    node={n}
                    isHovered={hoveredNode === n.id}
                    isDimmed={Boolean(hoveredNode && hoveredNode !== n.id && hoveredNode !== "hero-olt")}
                    onHover={(h) => interactive && setHoveredNode(h ? n.id : null)}
                  >
                    <span
                      data-pin={`in-${n.id}`}
                      className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                    />
                    <span
                      data-pin={`out-${n.id}`}
                      className="absolute -right-1 top-1/2 -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                    />
                  </NodeCard>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. COLUMN 5: YOUR MAC / END SUBSCRIBER (Far Right) ── */}
          <div className="flex flex-col w-[140px] justify-center">
            <span className="text-[9.5px] font-mono font-bold tracking-widest text-muted-foreground/75 uppercase pl-1 mb-1.5">
              SUBSCRIBER
            </span>
            <div className="pointer-events-auto topology-col5-node">
              <NodeCard
                node={col5Node}
                isHovered={hoveredNode === col5Node.id}
                isDimmed={Boolean(hoveredNode && hoveredNode !== col5Node.id && hoveredNode !== "hero-olt")}
                onHover={(h) => interactive && setHoveredNode(h ? col5Node.id : null)}
                highlightBadge
              >
                <span
                  data-pin="in-ont-0"
                  className="absolute -left-1 top-[20%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                />
                <span
                  data-pin="in-ont-1"
                  className="absolute -left-1 top-[40%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                />
                <span
                  data-pin="in-ont-2"
                  className="absolute -left-1 top-[60%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                />
                <span
                  data-pin="in-ont-3"
                  className="absolute -left-1 top-[80%] -translate-y-1/2 size-2 rounded-full border border-muted-foreground/60 bg-background pointer-events-none"
                />
              </NodeCard>
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
  children,
}: {
  node: NodeItem;
  isHovered: boolean;
  isDimmed: boolean;
  onHover: (hovered: boolean) => void;
  highlightBadge?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-node-id={node.id}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        "topology-node-card group relative w-full rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors",
        "bg-[#0f0f13]/95 dark:bg-[#0a0a0d]/95 border shadow-xs",
        isHovered
          ? "border-foreground/80 bg-accent/30 shadow-sm"
          : isDimmed
          ? "opacity-35 border-border/40"
          : "border-border/70 hover:border-foreground/40 hover:bg-muted/30"
      )}
    >
      {/* Anchor Port Pins */}
      {children}

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
            "text-[8.5px] font-mono px-1 py-0.2 rounded border",
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
