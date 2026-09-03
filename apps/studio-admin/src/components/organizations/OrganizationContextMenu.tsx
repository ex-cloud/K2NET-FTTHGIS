

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@k2net/ui";
import {
  ExternalLink,
  MessageCircle,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Globe,
  Network,
  Clock,
  Copy,
  Trash2,
  PauseCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { EnrichedOrganization, OrganizationStatus } from "./types";
import { getTenantUrl } from "@/lib/domain";

interface OrganizationContextMenuProps {
  organization: EnrichedOrganization;
  isActiveImpersonated?: boolean;
  onViewDetail?: (org: EnrichedOrganization) => void;
  onImpersonate?: (org: EnrichedOrganization) => void;
  onStopImpersonation?: (org: EnrichedOrganization) => void;
  onReopenPortal?: (org: EnrichedOrganization) => void;
  onOpenDomainModal?: (org: EnrichedOrganization) => void;
  onOpenQuotaModal?: (org: EnrichedOrganization) => void;
  onOpenFlagsModal?: (org: EnrichedOrganization) => void;
  onExtendTrial?: (org: EnrichedOrganization) => void;
  onUpdateStatus?: (org: EnrichedOrganization, status: OrganizationStatus) => void;
  onDelete?: (org: EnrichedOrganization) => void;
  children: React.ReactNode;
}

export function OrganizationContextMenu({
  organization,
  isActiveImpersonated,
  onViewDetail,
  onImpersonate,
  onStopImpersonation,
  onReopenPortal,
  onOpenDomainModal,
  onOpenQuotaModal,
  onOpenFlagsModal,
  onExtendTrial,
  onUpdateStatus,
  onDelete,
  children,
}: OrganizationContextMenuProps) {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleOpenWhatsApp = () => {
    if (!organization.picPhone) {
      toast.error("No WhatsApp number configured for this PIC");
      return;
    }
    const cleanPhone = organization.picPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const handleOpenEmail = () => {
    if (!organization.picEmail) {
      toast.error("No email address configured for this PIC");
      return;
    }
    window.location.href = `mailto:${organization.picEmail}?subject=[K2NET Enterprise] Support Inquiry for ${organization.name}`;
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-popover/95 backdrop-blur-xl border-border/80 shadow-2xl text-xs z-[9999] py-1.5 rounded-xl">
        {/* 1. Open Organization Detail */}
        <ContextMenuItem
          onClick={() => onViewDetail?.(organization)}
          className="cursor-pointer font-semibold text-foreground focus:bg-accent gap-2"
        >
          <Network className="w-3.5 h-3.5 text-primary" />
          <span>Open Organization Detail</span>
          <ContextMenuShortcut>↵</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 2. Super Admin Impersonation */}
        {isActiveImpersonated ? (
          <>
            <ContextMenuItem
              onClick={() => onReopenPortal?.(organization)}
              className="cursor-pointer font-medium text-primary focus:bg-primary/10 focus:text-primary gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Kembali Portal Tenant</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onStopImpersonation?.(organization)}
              className="cursor-pointer font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive gap-2"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Akhiri Sesi Impersonasi</span>
              <ContextMenuShortcut>Ctrl ⇧ ⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem
            onClick={() => onImpersonate?.(organization)}
            className="cursor-pointer font-medium text-primary focus:bg-primary/10 focus:text-primary gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Login as Tenant Admin</span>
            <ContextMenuShortcut>Ctrl ↵</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator className="bg-border/40 my-1" />

        {/* 2. Direct Technical PIC Contact */}
        <ContextMenuItem
          onClick={handleOpenWhatsApp}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
          <span>Chat PIC via WhatsApp</span>
          <ContextMenuShortcut>W</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={handleOpenEmail}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Mail className="w-3.5 h-3.5 text-blue-500" />
          <span>Send Email to PIC</span>
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/40 my-1" />

        {/* 3. Change Status Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="cursor-pointer gap-2 focus:bg-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Lifecycle Status</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48 bg-popover/95 backdrop-blur-xl border-border/80 shadow-xl rounded-xl py-1">
            <ContextMenuItem
              onClick={() => onUpdateStatus?.(organization, "ACTIVE")}
              className="cursor-pointer gap-2 focus:bg-muted"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Set Active</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.(organization, "SUSPENDED")}
              className="cursor-pointer gap-2 focus:bg-muted text-destructive"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Suspend Tenant</span>
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onUpdateStatus?.(organization, "TRIAL")}
              className="cursor-pointer gap-2 focus:bg-muted text-blue-500"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Set as Trial</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* 4. Feature Flags & Add-ons */}
        <ContextMenuItem
          onClick={() => onOpenFlagsModal?.(organization)}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Feature Flags & Add-ons</span>
          <ContextMenuShortcut>F</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 5. Custom Domain & SSL */}
        <ContextMenuItem
          onClick={() => onOpenDomainModal?.(organization)}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Custom Domain & SSL</span>
          <ContextMenuShortcut>D</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 6. Hardware Quotas */}
        <ContextMenuItem
          onClick={() => onOpenQuotaModal?.(organization)}
          className="cursor-pointer gap-2 focus:bg-muted"
        >
          <Network className="w-3.5 h-3.5 text-muted-foreground" />
          <span>FTTH Spatial Quotas</span>
          <ContextMenuShortcut>Q</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 7. Extend Trial */}
        <ContextMenuItem
          onClick={() => onExtendTrial?.(organization)}
          className="cursor-pointer gap-2 focus:bg-muted text-amber-500"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Extend Trial (+14 Days)</span>
          <ContextMenuShortcut>T</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-border/40 my-1" />

        {/* 8. Copy Details Submenu */}
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

        <ContextMenuSeparator className="bg-border/40 my-1" />

        {/* 9. Delete Organization */}
        <ContextMenuItem
          onClick={() => onDelete?.(organization)}
          className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Organization</span>
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
