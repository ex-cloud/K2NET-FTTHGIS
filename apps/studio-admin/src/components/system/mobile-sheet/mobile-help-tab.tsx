import * as React from "react";
import {
  Sparkles,
  FileText,
  Terminal,
  BarChart3,
  Mail,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Badge, Button } from "@k2net/ui";

interface MobileHelpTabProps {
  onNavigate: (url: string) => void;
  onOpenAi: () => void;
}

export function MobileHelpTab({ onNavigate, onOpenAi }: MobileHelpTabProps) {
  const helpItems = [
    {
      title: "K2NET Assistant",
      desc: "Get guided help with your FTTH network directly in Studio.",
      icon: Sparkles,
      action: onOpenAi,
    },
    {
      title: "Documentation",
      desc: "Browse guides, PostGIS schemas, and product references.",
      icon: FileText,
      action: () => onNavigate("/ai/knowledge"),
    },
    {
      title: "Troubleshooting & Forensics",
      desc: "Find fixes for common platform issues and gateway errors.",
      icon: Terminal,
      action: () => onNavigate("/observability/overview"),
    },
    {
      title: "Platform Status",
      desc: "Check incidents, maintenance, and live poller uptime.",
      icon: BarChart3,
      action: () => onNavigate("/observability/compute"),
    },
    {
      title: "Contact NOC Support",
      desc: "Reach engineering support for critical platform escalations.",
      icon: Mail,
      action: () => onNavigate("/settings/general"),
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in-0 duration-200">
      {/* Header with Health Badge */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-muted/20">
        <span className="text-xs font-bold text-foreground">Help &amp; Support</span>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          All systems operational
        </Badge>
      </div>

      {/* Help Navigation Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {helpItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/60 hover:bg-muted/60 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                <ItemIcon className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-relaxed">
                    {item.desc}
                  </span>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}

        {/* Community & NOC Banner */}
        <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 mt-4 space-y-2">
          <span className="text-xs font-bold text-foreground block">
            K2NET Enterprise NOC Community
          </span>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Join our enterprise ISP engineers channel to discuss network topology, OLT firmware, and sync issues.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigate("/observability/messaging")}
            className="w-full h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <MessageSquare className="size-3 mr-1.5" /> Open Support Channel
          </Button>
        </div>
      </div>
    </div>
  );
}
