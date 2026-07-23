"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, User, Key, Shield, FileText, Loader2 
} from "lucide-react";
import { SystemHeader } from "@/components/system/system-header";
import { GlobalHeader } from "@/components/global-header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [subdomain, setSubdomain] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.startsWith("system.") || hostname.startsWith("system-")) {
        setSubdomain("system");
      } else {
        const parts = hostname.split(".");
        if (parts.length > 2 && parts[0] !== "www") {
          setSubdomain(parts[0]);
        }
      }
    }
  }, []);

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground text-xs">Memuat Pengaturan Akun...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Determine back to dashboard link dynamically based on subdomain
  const getDashboardUrl = () => {
    if (typeof window === "undefined") return "/dashboard";
    const hostname = window.location.hostname;
    if (hostname.startsWith("system.") || hostname.startsWith("system-")) {
      return "/organizations";
    }
    return "/dashboard";
  };

  const navItems = [
    {
      label: "Preferences",
      href: "/account/preferences",
      icon: User,
    },
    {
      label: "Access Tokens",
      href: "/account/tokens",
      icon: Key,
      disabled: true,
    },
    {
      label: "Security",
      href: "/account/security",
      icon: Shield,
      disabled: true,
    },
  ];

  const logItems = [
    {
      label: "Audit Logs",
      href: "/account/logs",
      icon: FileText,
      disabled: true,
    },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      
      {/* Top Header Terintegrasi */}
      {subdomain === "system" ? <SystemHeader /> : <GlobalHeader />}

      {/* Main Workspace (Sidebar + Content) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar Navigasi Kiri */}
        <aside className="w-64 border-r border-border bg-sidebar shrink-0 hidden md:flex flex-col">
          {/* Back Link */}
          <div className="px-4 py-4">
            <Link
              href={getDashboardUrl()}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-lg hover:bg-sidebar-accent transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </Link>
          </div>

          {/* Sidebar Sections */}
          <nav className="flex-1 px-4 space-y-6">
            <div className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-wider">
                Account Settings
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-sidebar-foreground/30 cursor-not-allowed rounded-lg"
                      title="Akan datang segera"
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[8px] px-1 py-0.5 rounded bg-card/5 text-sidebar-foreground/30 uppercase">Soon</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? subdomain === "system"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "bg-primary/10 text-primary font-semibold"
                        : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-wider">
                Logs
              </p>
              {logItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-sidebar-foreground/30 cursor-not-allowed rounded-lg"
                      title="Akan datang segera"
                    >
                      <Icon className="w-4.5 h-4.5" />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[8px] px-1 py-0.5 rounded bg-card/5 text-sidebar-foreground/30 uppercase">Soon</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? subdomain === "system"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "bg-primary/10 text-primary font-semibold"
                        : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content Body */}
          <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
}
