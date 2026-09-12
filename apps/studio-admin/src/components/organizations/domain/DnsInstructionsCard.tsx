import * as React from "react";
import { Copy } from "lucide-react";
import { ActionTooltip } from "@k2net/ui";

interface DnsInstructionsCardProps {
  onCopy: (text: string, label?: string) => void;
}

export function DnsInstructionsCard({ onCopy }: DnsInstructionsCardProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 space-y-2.5 text-xs">
      <span className="font-semibold text-foreground block">
        DNS Configuration Instructions
      </span>
      <p className="text-muted-foreground text-[11px] leading-relaxed">
        Create a DNS <strong className="text-foreground font-mono">CNAME</strong> record on your domain registrar pointing to K2NET Edge Router:
      </p>

      <div className="flex items-center justify-between rounded-lg bg-background/80 border border-border/60 p-2.5 font-mono text-[11px]">
        <div className="space-y-0.5">
          <span className="text-muted-foreground text-[10px] block font-mono">TARGET CNAME</span>
          <span className="text-primary font-bold">cname.kdua.net</span>
        </div>
        <ActionTooltip label="Copy target CNAME">
          <button
            onClick={() => onCopy("cname.kdua.net", "CNAME target copied")}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </ActionTooltip>
      </div>
    </div>
  );
}
