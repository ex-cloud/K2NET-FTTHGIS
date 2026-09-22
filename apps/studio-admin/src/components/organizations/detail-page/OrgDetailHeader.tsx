import * as React from "react";
import { Badge, PageHeader } from "@k2net/ui";
import { Building2, FileDown } from "lucide-react";
import type { EnrichedOrganization } from "../types";

interface OrgDetailHeaderProps {
  org: EnrichedOrganization;
  onExportMarkdown: () => void;
}

export function OrgDetailHeader({ org, onExportMarkdown }: OrgDetailHeaderProps) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: "Organizations", href: "/organizations" },
        { label: org.name, icon: Building2 },
      ]}
      actions={
        <>
          <Badge variant="outline" className="text-[11px] font-mono border-border/80 bg-muted/40 text-muted-foreground">
            ORG-{org.slug.toUpperCase()}
          </Badge>

          <button
            onClick={onExportMarkdown}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title="Copy Spec as Markdown"
          >
            <FileDown className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Export Spec</span>
          </button>
        </>
      }
    />
  );
}

