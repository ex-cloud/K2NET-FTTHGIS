"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@k2net/ui";
import { Separator } from "@k2net/ui";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { UserNav } from "./user-nav";
import { GodModeIndicator } from "./system/god-mode-indicator";
import Image from "next/image";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export function GlobalHeader() {
  const router = useRouter();
  const { settings = [] } = useSystemSettings();
  const systemLogo = settings.find((s) => s.key === "logo_url")?.value || "";

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-border bg-background px-4 z-50 py-2">
      <div className="flex items-center gap-x-1">
        <div 
          onClick={() => {
             // Admin portal: logo always goes to /organizations
             router.push("/organizations");
          }}
          className="flex items-center cursor-pointer mr-1"
        >
          <div className={systemLogo ? "flex h-5 w-5 items-center justify-center rounded overflow-hidden" : "flex h-5 w-5 items-center justify-center rounded bg-primary/10 border border-primary/30 group"}>
            {systemLogo ? (
              <Image
                src={systemLogo}
                width={20}
                height={20}
                className="h-5 w-5 object-contain"
                alt="System Logo"
                unoptimized
              />
            ) : (
              <div
               className="h-2 w-2 bg-primary group-hover:scale-110 transition-transform shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
                style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
              />
            )}
          </div>
        </div>
        <Separator orientation="vertical" className="mx-0.5 h-4 bg-border/40" />
        
        <BreadcrumbNav />
      </div>

      <div className="flex items-center gap-1">
        <GodModeIndicator />

        <Button
          variant="ghost"
          size="sm"
          className="hidden text-muted-foreground hover:text-foreground md:flex text-[11px] font-medium h-8 px-2"
        >
          Feedback
        </Button>


        <div className="flex items-center gap-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => alert("Help Center feature coming soon!")}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() =>
              (window.location.href = "mailto:support@ftthgis.com")
            }
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-4 bg-border" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
