"use client";

import { LoginForm } from "@/components/auth/login-form";
import { ShieldAlert, BookOpen, Quote, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      
      {/* LEFT COLUMN: Login Form (Supabase Style) */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between p-6 sm:p-12 md:p-16 relative bg-sidebar border-r border-border">
        
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

      {/* RIGHT COLUMN: Testimonial & Glowing Ambient Background */}
      <div className="hidden lg:flex flex-1 bg-background flex-col items-center justify-center p-16 relative overflow-hidden">
        
        {/* Subtle Ambient Glowing Spots */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-muted/10 rounded-full blur-3xl" />

        {/* Grid pattern background overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Testimonial Quote Container */}
        <div className="max-w-md w-full z-10 space-y-6">
          <Quote className="h-8 w-8 text-primary/80 transform rotate-180" />
          
          <blockquote className="text-xl font-light text-foreground leading-relaxed font-sans">
            &ldquo;Managing enterprise fiber-to-the-home geodata networks has never been this seamless. Highly stable, fast geocoding, and fully isolated multi-tenancy.&rdquo;
          </blockquote>

          <div className="flex items-center gap-3 pt-2">
            <div className="relative h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold font-mono text-xs shadow-md">
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
