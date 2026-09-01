import React from "react";
import { ShieldCheck, BookOpen, Quote } from "lucide-react";
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
  portalName = "FTTH GIS Platform",
  portalSubtitle = "Enterprise Multi-Tenant SaaS",
  docsUrl = "https://system-gis.kdua.net/gateways/overview",
  testimonialQuote = "Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy.",
  testimonialAuthor = "Andiansyah",
  testimonialRole = "Chief Technology Officer, K2NET",
  figureComponent,
}: AuthLoginLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* ─── LEFT COLUMN: FORM & BRAND ─────────────────────────── */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:max-w-[560px] xl:max-w-[620px] z-10 border-r border-border/40 bg-card/30 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground block">
                {portalName}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {portalSubtitle}
              </span>
            </div>
          </div>

          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>System Docs</span>
            </a>
          )}
        </div>

        {/* Center Content */}
        <div className="my-auto py-8">
          {children}
        </div>

        {/* Footer */}
        <div className="space-y-3 pt-6 border-t border-border/40 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Zero-Trust Enterprise IAM &bull; TLS 1.3 Strict &bull; OIDC PKCE</span>
          </div>
          <div className="text-[11px] text-muted-foreground/80 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span>&copy; {new Date().getFullYear()} K2NET Enterprise. All rights reserved.</span>
            <div className="flex gap-3">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Security</a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: 3D ISOMETRIC FIGURE & TESTIMONIAL ───── */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-between overflow-hidden bg-dot-grid p-12 xl:p-16 border-l border-border/20">
        {/* Subtle Gradient Glows */}
        <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        {/* Top Eyebrow */}
        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM ONLINE &bull; K2NET KONG MESH
          </span>
          <span>ENTERPRISE GRADE GIS</span>
        </div>

        {/* 3D Isometric Figure Showcase */}
        <div className="my-auto flex flex-col items-center justify-center py-6 scale-95 xl:scale-105 transition-transform duration-500">
          <div className="w-full max-w-[480px]">
            {figureComponent || <LinearPurposeBuiltFigure />}
          </div>
        </div>

        {/* CTO Testimonial Card */}
        <div className="relative rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md shadow-xl shadow-black/5">
          <Quote className="h-6 w-6 text-primary/40 mb-3" />
          <blockquote className="text-sm font-medium text-foreground/90 leading-relaxed mb-4">
            &ldquo;{testimonialQuote}&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm ring-1 ring-primary/30">
              {testimonialAuthor.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {testimonialAuthor}
              </div>
              <div className="text-xs text-muted-foreground">
                {testimonialRole}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
