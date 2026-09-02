import React from "react";
import { ShieldCheck, BookOpen, Quote, Sparkles } from "lucide-react";
import { ModeToggle } from "../mode-toggle";
import { LinearPurposeBuiltFigure } from "../linear-isometric/figures/fig-01-purpose-built";

export interface AuthLoginLayoutProps {
  children: React.ReactNode;
  portalName?: string;
  portalSubtitle?: string;
  docsUrl?: string;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  testimonialRole?: string;
  figureComponent?: React.ReactNode;
}

export function AuthLoginLayout({
  children,
  portalName = "FTTH GIS Portal",
  portalSubtitle = "Sign in to your system administrator account.",
  docsUrl = "https://system-gis.kdua.net/gateways/overview",
  testimonialQuote = "Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy.",
  testimonialAuthor = "Andiansyah",
  testimonialRole = "Chief Technology Officer, K2NET",
  figureComponent,
}: AuthLoginLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary font-sans">
      
      {/* ─── LEFT COLUMN: Login Form & Header ─────────────────────────── */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between p-6 sm:p-10 md:p-14 relative bg-sidebar border-r border-border z-10">
        
        {/* Top Header Row (Logo + Docs + Theme Toggle) */}
        <div className="flex items-center justify-between w-full z-20">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 border border-primary/25">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-foreground font-mono">
              {portalName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-background/50 hover:bg-accent/80 hover:text-foreground transition-all text-[11px] font-medium text-muted-foreground shadow-xs"
              >
                <BookOpen className="h-3 w-3" />
                <span>System Docs</span>
              </a>
            )}
            <ModeToggle className="h-8 w-8 rounded-lg border border-border/80 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-accent/80" />
          </div>
        </div>

        {/* Center Form Area */}
        <div className="w-full max-w-sm mx-auto my-auto py-8 z-20 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {portalSubtitle}
            </p>
          </div>

          {/* Form wrapper */}
          {children}
        </div>

        {/* Bottom Footer Row */}
        <div className="text-[11px] text-muted-foreground z-20 flex flex-col gap-1.5 border-t border-border/40 pt-5">
          <p>
            By continuing, you agree to FTTH GIS&apos;s{" "}
            <a href="#" className="underline text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70">
            &copy; {new Date().getFullYear()} K2NET Enterprise SaaS Platform.
          </p>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: 3D Isometric Figure & Testimonial ───────────── */}
      <div className="hidden lg:flex flex-1 bg-background flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        
        {/* Subtle Ambient Glowing Background Blobs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Grid pattern background overlay */}
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Right Figure Pill Badge */}
        <div className="w-full flex justify-end z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/60 bg-card/60 backdrop-blur-md text-[10px] font-mono font-semibold tracking-wider text-muted-foreground uppercase shadow-xs">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>FIG 0.1: PURPOSE-BUILT ARCHITECTURE</span>
          </div>
        </div>

        {/* Center Isometric 3D Figure */}
        <div className="my-auto flex flex-col items-center justify-center py-6 scale-100 xl:scale-110 transition-transform duration-500 z-10">
          <div className="w-full max-w-[440px]">
            {figureComponent || <LinearPurposeBuiltFigure size="card" interactive={true} />}
          </div>
        </div>

        {/* Bottom Right Testimonial Card */}
        <div className="w-full max-w-lg mx-auto z-10">
          <div className="relative rounded-2xl border border-border/70 bg-card/75 p-6 backdrop-blur-xl shadow-2xl shadow-black/20">
            <Quote className="h-6 w-6 text-primary/60 mb-3 transform rotate-180" />
            <blockquote className="text-xs sm:text-sm font-normal text-foreground/90 leading-relaxed mb-4 font-sans">
              &ldquo;{testimonialQuote}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3 pt-1 border-t border-border/40">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs shadow-xs">
                {testimonialAuthor.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">
                  {testimonialAuthor}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {testimonialRole}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
