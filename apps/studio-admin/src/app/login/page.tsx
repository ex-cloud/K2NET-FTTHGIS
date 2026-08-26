"use client";

import React, { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { ShieldAlert, BookOpen, Quote, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import {
  renderIsometricFigureById,
  ISOMETRIC_FIGURES_LIST,
  Badge,
} from "@k2net/ui";
import { useUIStore } from "@/store/ui-store";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function AdminLoginPage() {
  const storeHeroId = useUIStore((state) => state.activeLoginHeroId);
  const [activeHeroId, setActiveHeroId] = useState<string>("fig-01");

  useEffect(() => {
    // 1. Initial priority: Cookie -> LocalStorage -> Store
    const cookieHero = getCookie("k2net_global_login_hero");
    const localHero =
      localStorage.getItem("k2net_active_login_hero") ||
      localStorage.getItem("k2net_login_hero_variant");

    const initialHero = cookieHero || localHero || storeHeroId || "fig-01";
    if (initialHero.startsWith("fig-")) {
      setActiveHeroId(initialHero);
    }

    // 2. Fetch server global setting to ensure multi-browser sync
    fetch("/api/system/login-hero")
      .then((res) => res.json())
      .then((data) => {
        if (data?.activeHeroId && data.activeHeroId.startsWith("fig-")) {
          setActiveHeroId(data.activeHeroId);
        }
      })
      .catch(() => {});

    // 3. Storage event listener for multi-tab sync
    const handleStorageChange = () => {
      try {
        const stored =
          localStorage.getItem("k2net_active_login_hero") ||
          localStorage.getItem("k2net_login_hero_variant");

        if (stored && stored.startsWith("fig-")) {
          setActiveHeroId(stored);
        }
      } catch (_) {}
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [storeHeroId]);

  const activeFigureMeta =
    ISOMETRIC_FIGURES_LIST.find((f) => f.id === activeHeroId) ||
    ISOMETRIC_FIGURES_LIST[0];

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      
      {/* LEFT COLUMN: Login Form (Supabase / Linear Style) */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-sidebar border-r border-border z-20">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full z-20">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-foreground font-mono">
              FTTH GIS Portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/gateways/overview"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-accent hover:text-foreground transition-all text-[10px] font-medium text-muted-foreground"
            >
              <BookOpen className="h-3 w-3" />
              System Docs
            </Link>
            <ModeToggle />
          </div>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-sm mx-auto my-auto py-12 z-20 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-xs text-muted-foreground">
              Sign in to your system administrator account.
            </p>
          </div>

          {/* Form wrapper */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl backdrop-blur-xs">
            <LoginForm isAdmin={true} />
          </div>
          
          <div className="flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3 text-[10px] text-primary leading-normal">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>Authorized access only. All actions are logged and audited in accordance with global compliance standards.</span>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div className="text-[10px] text-muted-foreground z-20 flex flex-col gap-2 border-t border-border pt-6">
          <p>
            By continuing, you agree to FTTH GIS&apos;s{" "}
            <a href="#" className="underline hover:text-muted-foreground">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-muted-foreground">Privacy Policy</a>.
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/60">
            © 2026 K2NET Enterprise SaaS Platform.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Monochrome Pure SVG Hero Canvas & Testimonial */}
      <div className="hidden lg:flex flex-1 bg-background flex-col items-center justify-between p-12 xl:p-16 relative overflow-hidden">
        
        {/* Top Floating Badge Indicator (Monochrome) */}
        <div className="w-full flex justify-end z-20">
          <Badge
            variant="outline"
            className="border-border/80 bg-card/70 backdrop-blur-md text-foreground font-mono text-[10px] px-3 py-1 gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <span>{activeFigureMeta.fig}: {activeFigureMeta.title}</span>
          </Badge>
        </div>

        {/* Center Pure SVG Hero Viewport: Monochrome Isometric Architecture */}
        <div className="w-full max-w-md my-auto flex items-center justify-center z-10 pointer-events-auto">
          {renderIsometricFigureById(activeHeroId, "hero")}
        </div>

        {/* Ambient Subtle Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Bottom Glassmorphic Testimonial Quote Container */}
        <div className="w-full max-w-lg z-20 space-y-4 bg-card/60 backdrop-blur-xl border border-border/60 p-6 rounded-2xl shadow-2xl">
          <Quote className="h-6 w-6 text-foreground/80 transform rotate-180" />
          
          <blockquote className="text-sm md:text-base font-light text-foreground leading-relaxed font-sans">
            &ldquo;Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy.&rdquo;
          </blockquote>

          <div className="flex items-center gap-3 pt-1 border-t border-border/40">
            <div className="relative h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold font-mono text-xs shadow-md">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Andiansyah</p>
              <p className="text-[10px] text-muted-foreground font-mono">Chief Technology Officer, K2NET</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
