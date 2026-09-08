import React, { useState } from "react";
import { ShieldCheck, BookOpen, Quote, Sparkles, X, CheckCircle2, Lock } from "lucide-react";
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
  const [activePolicyModal, setActivePolicyModal] = useState<"terms" | "privacy" | null>(null);

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
            <button
              type="button"
              onClick={() => setActivePolicyModal("terms")}
              className="underline text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => setActivePolicyModal("privacy")}
              className="underline text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
            >
              Privacy Policy
            </button>.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70">
            &copy; {new Date().getFullYear()} K2NET Enterprise SaaS Platform. All rights reserved.
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

      {/* ─── INTERACTIVE POLICY MODAL DIALOG ──────────────────────────── */}
      {activePolicyModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActivePolicyModal(null)}
        >
          <div 
            className="bg-card border border-border/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">
                      {activePolicyModal === "terms" ? "Terms of Service" : "Privacy Policy"}
                    </h2>
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded">
                      v2026.3
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    K2NET Enterprise SaaS Platform Governance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex bg-background border border-border rounded-lg p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActivePolicyModal("terms")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activePolicyModal === "terms" 
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePolicyModal("privacy")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activePolicyModal === "privacy" 
                        ? "bg-cyan-500 text-white font-semibold shadow-xs" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Privacy
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePolicyModal(null)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-foreground/80 leading-relaxed">
              {activePolicyModal === "terms" ? (
                <>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs font-mono">
                      <Lock className="h-3.5 w-3.5" />
                      <span>ENTERPRISE SAAS MASTER AGREEMENT</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These Terms of Service govern your organization&apos;s access to the K2NET FTTH GIS Enterprise SaaS Platform, microservices, telemetry engines, and GIS mapping interfaces.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">1. SaaS License & Spatial Sovereignty (You Own Your Data)</h3>
                    <p className="text-xs text-muted-foreground">
                      You retain 100% full intellectual property rights, title, and ownership of all customer records, geospatial vector geometries (ODP, ODC, closures, poles, fiber cables), and operational telemetry. K2NET does not claim ownership or sell your proprietary spatial GIS data.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">2. IAM & Policy-Based Access Control (PBAC)</h3>
                    <p className="text-xs text-muted-foreground">
                      Authentication is enforced via Keycloak IAM with mandatory MFA and granular PBAC permissions. You are responsible for safeguarding admin credentials and API tokens.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">3. High Availability SLA (99.9% Uptime)</h3>
                    <p className="text-xs text-muted-foreground">
                      We provide a 99.9% operational availability SLA for Enterprise tiers backed by 3-tier disaster recovery replication (Local SSD, MinIO S3, Offsite Cloud WebDAV).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">4. Data Portability & Termination</h3>
                    <p className="text-xs text-muted-foreground">
                      Export your entire dataset anytime in open GIS formats (GeoJSON, ESRI Shapefile, PostGIS SQL dumps, CSV). A 30-day export grace period is provided upon subscription termination.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-cyan-500 font-semibold text-xs font-mono">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>PRIVACY & DATA PROTECTION STANDARDS</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      How K2NET collects, processes, encrypts, and isolates organizational telemetry and spatial data in strict compliance with UU PDP No. 27/2022 and GDPR frameworks.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">1. Zero-Trust Storage & Encryption</h3>
                    <p className="text-xs text-muted-foreground">
                      All data in transit is encrypted using mandatory TLS 1.3. All data at rest is encrypted with AES-256-GCM. Strict PostgreSQL row-level and schema tenant isolation is enforced at the gateway layer.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">2. Telemetry & Audit Trails</h3>
                    <p className="text-xs text-muted-foreground">
                      Audit logs, OLT SNMP metrics, and API gateway access records are streamed asynchronously to dedicated audit storage with immutable cryptographic verification.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">3. No Third-Party Trackers</h3>
                    <p className="text-xs text-muted-foreground">
                      We only use strictly necessary authentication session tokens. We never deploy advertising cookies or marketing tracking pixels.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border/60 bg-muted/30">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>TLS 1.3 &bull; AES-256 GCM &bull; UU PDP & ISO/IEC 27001</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicyModal(null)}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                I Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
