import * as React from "react";
import { Link } from "@/lib/navigation-compat";
import { Badge } from "@k2net/ui";
import { Building2, FileDown } from "lucide-react";
import type { EnrichedOrganization } from "../types";

interface OrgDetailHeaderProps {
  org: EnrichedOrganization;
  onExportMarkdown: () => void;
}

export function OrgDetailHeader({ org, onExportMarkdown }: OrgDetailHeaderProps) {
  return (
    <div className="px-6 py-3.5 border-b border-border/50 shrink-0 flex items-center justify-between bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/organizations"
          className="text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          Organizations
        </Link>
        <span className="text-muted-foreground/60">›</span>
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span>{org.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[11px] font-mono border-border/80 bg-muted/40 text-muted-foreground">
          ORG-{org.slug.toUpperCase()}
        </Badge>

        <button
          onClick={onExportMarkdown}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Copy Spec as Markdown"
        >
          <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Export Spec</span>
        </button>
      </div>
    </div>
  );
}
