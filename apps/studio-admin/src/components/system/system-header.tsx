import * as React from "react";
import { Link, Image } from "@/lib/navigation-compat";
import { ShieldCheck } from "lucide-react";
import {
  Separator,
  AppHeaderShell,
  AppHeaderActions,
} from "@k2net/ui";
import { UserNav } from "../user-nav";
import { useCommandPalette } from "../command-palette/command-palette-provider";
import { getLogoUrl } from "@/lib/domain";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export function SystemHeader() {
  const { settings = [] } = useSystemSettings();
  const { openCommandPalette } = useCommandPalette();

  const appName = settings.find((s) => s.key === "app_name")?.value || "System Admin";
  const logoUrl = settings.find((s) => s.key === "logo_url")?.value || "";

  return (
    <AppHeaderShell
      leftSection={
        <>
          <Link href="/overview" className="flex items-center cursor-pointer shrink-0" title={`${appName} Overview`}>
            <div className={logoUrl ? "flex size-6 items-center justify-center rounded overflow-hidden" : "flex size-6 items-center justify-center rounded bg-primary/10 border border-primary/30 group overflow-hidden"}>
              {logoUrl ? (
                <Image
                  src={getLogoUrl(logoUrl)}
                  width={22}
                  height={22}
                  className="size-5.5 object-contain"
                  alt="Logo"
                  unoptimized
                />
              ) : (
                <ShieldCheck className="size-3.5 text-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </div>
          </Link>

          <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/80 shrink-0" />

          {/* Dynamic App Name (Visible across Desktop & Mobile) */}
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary truncate max-w-[140px] sm:max-w-none shrink-0">
            {appName}
          </span>
        </>
      }
      rightSection={
        <AppHeaderActions
          onOpenSearch={() => openCommandPalette()}
          searchLabel="Search or jump to..."
          searchShortcut="⌘K"
          searchWidthClass="w-48 lg:w-56"
          onOpenAi={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
            }
          }}
          aiLabel="Ask AI Copilot"
          aiShortcut="Ctrl+J"
          helpLabel="Help & Support"
          helpShortcut="?"
          notificationsLabel="System Messages"
          notificationsShortcut="M"
          userNavSlot={<UserNav />}
        />
      }
    />
  );
}
