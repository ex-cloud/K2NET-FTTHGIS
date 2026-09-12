import * as React from "react";
import {
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuItem,
} from "@k2net/ui";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { getTenantUrl } from "@/lib/domain";
import type { EnrichedOrganization } from "../types";

interface OrgCopySubmenuProps {
  organization: EnrichedOrganization;
}

export function OrgCopySubmenu({ organization }: OrgCopySubmenuProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Copy Tenant Info</span>
      </ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl rounded-xl py-1">
        <ContextMenuItem
          onClick={() => handleCopy(organization.slug, "Tenant Slug")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <span>Copy Slug ({organization.slug})</span>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleCopy(getTenantUrl(organization.slug), "Tenant Portal URL")}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <span>Copy Subdomain URL</span>
        </ContextMenuItem>
        {organization.picPhone && (
          <ContextMenuItem
            onClick={() => handleCopy(organization.picPhone!, "PIC Phone")}
            className="cursor-pointer gap-2 focus:bg-muted"
          >
            <span>Copy PIC Phone</span>
          </ContextMenuItem>
        )}
        {organization.customDomain && (
          <ContextMenuItem
            onClick={() => handleCopy(organization.customDomain!, "Custom Domain")}
            className="cursor-pointer gap-2 focus:bg-muted"
          >
            <span>Copy Custom Domain</span>
          </ContextMenuItem>
        )}
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}
