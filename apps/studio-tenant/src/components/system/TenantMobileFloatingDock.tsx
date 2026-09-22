import * as React from "react";
import {
  Search,
  HelpCircle,
  Sparkles,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface TenantMobileFloatingDockProps {
  onOpenCommandPalette: () => void;
  onOpenAi: () => void;
  onOpenHelp: () => void;
  onOpenNotif: () => void;
}

export function TenantMobileFloatingDock({
  onOpenCommandPalette,
  onOpenAi,
  onOpenHelp,
  onOpenNotif,
}: TenantMobileFloatingDockProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex md:hidden pointer-events-auto">
      <div className="flex items-center gap-1 bg-popover/95 backdrop-blur-xl border border-border/80 text-foreground shadow-lg rounded-full px-2.5 py-1.5 text-xs animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* 1. Quick Search / Command Palette */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Search or jump to... (⌘K)"
        >
          <Search className="size-4" />
        </button>

        {/* 2. Help & Support */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Help & SOP Guide"
        >
          <HelpCircle className="size-4" />
        </button>

        {/* 3. Ask AI Copilot */}
        <button
          type="button"
          onClick={onOpenAi}
          className="p-2 rounded-full hover:bg-muted text-primary hover:text-primary transition-colors cursor-pointer"
          title="Ask AI Copilot (Ctrl+J)"
        >
          <Sparkles className="size-4" />
        </button>

        {/* 4. Messages / Alerts */}
        <button
          type="button"
          onClick={onOpenNotif}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="System Notifications"
        >
          <MessageSquare className="size-4" />
        </button>

        {/* 5. GIS Map */}
        <button
          type="button"
          onClick={() => navigate({ to: "/map" })}
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          title="Peta Spasial GIS"
        >
          <MapPin className="size-4" />
        </button>
      </div>
    </div>
  );
}
