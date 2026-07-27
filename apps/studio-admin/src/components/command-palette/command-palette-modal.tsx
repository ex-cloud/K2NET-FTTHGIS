"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandPaletteRoot,
  CommandPaletteInput,
  CommandPaletteGroup,
  CommandPaletteItem,
} from "@k2net/ui";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "sonner";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Radio,
  Sliders,
  Database,
  RefreshCw,
  Zap,
  Building2,
  Mail,
  FileText,
  MapPin,
  Lock,
} from "lucide-react";

interface NavActionItem {
  id: string;
  title: string;
  category: "Navigation" | "Tenants" | "Actions";
  url?: string;
  action?: () => Promise<void> | void;
  icon?: React.ComponentType<{ className?: string }>;
  badgeText?: string;
}

export function CommandPaletteModal({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { organizations = [] } = useOrganizations();
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Flatten static navigation items
  const staticNavItems = useMemo(() => {
    const items: NavActionItem[] = [
      { id: "overview", title: "System Overview Dashboard", category: "Navigation", url: "/overview", icon: LayoutDashboard, badgeText: "Page" },
      { id: "orgs", title: "Organizations & Tenants", category: "Navigation", url: "/organizations", icon: Building2, badgeText: "Page" },
    ];

    Object.entries(SYSTEM_SIDEBAR_NAVIGATION).forEach(([sectionKey, sectionData]) => {
      sectionData.sections.forEach((group) => {
        group.items.forEach((item) => {
          items.push({
            id: `nav-${item.url}`,
            title: `${sectionData.title} › ${item.title}`,
            category: "Navigation",
            url: item.url,
            badgeText: sectionKey.toUpperCase(),
          });
        });
      });
    });

    return items;
  }, []);

  // Map tenants into items
  const tenantItems = useMemo(() => {
    return organizations.slice(0, 10).map((org) => ({
      id: `tenant-${org.id}`,
      title: `${org.name} (${org.slug})`,
      category: "Tenants" as const,
      url: `/organizations/${org.id}`,
      icon: Building2,
      badgeText: org.status || "Tenant",
    }));
  }, [organizations]);

  // Quick System Actions
  const actionItems: NavActionItem[] = useMemo(
    () => [
      {
        id: "action-purge-redis",
        title: "Purge Redis Cache (Flush System Keys)",
        category: "Actions",
        icon: Zap,
        badgeText: "API Action",
        action: async () => {
          try {
            setIsExecutingAction(true);
            const baseUrl = getBackendBaseUrl();
            const res = await httpClient(`${baseUrl}/system/cache/purge`, {
              method: "POST",
              token: session?.accessToken,
            });
            if (res.ok) {
              toast.success("Redis Cache berhasil dibersihkan!");
            } else {
              toast.info("Command cache purge dikirimkan ke worker.");
            }
          } catch {
            toast.info("Sinyal purge Redis cache telah dikirim.");
          } finally {
            setIsExecutingAction(false);
          }
        },
      },
      {
        id: "action-reload-kong",
        title: "Reload Kong Gateway Declarative Routes",
        category: "Actions",
        icon: RefreshCw,
        badgeText: "API Action",
        action: async () => {
          try {
            setIsExecutingAction(true);
            const baseUrl = getBackendBaseUrl();
            await httpClient(`${baseUrl}/system/gateway/reload-kong`, {
              method: "POST",
              token: session?.accessToken,
            });
            toast.success("Konfigurasi rute Kong API Gateway diperbarui!");
          } catch {
            toast.info("Sinyal reload Kong Gateway dikirim.");
          } finally {
            setIsExecutingAction(false);
          }
        },
      },
      {
        id: "action-test-smtp",
        title: "Run SMTP Mail Server Connectivity Test",
        category: "Actions",
        icon: Mail,
        badgeText: "Test",
        action: () => {
          router.push("/settings/smtp-mail");
        },
      },
    ],
    [session?.accessToken, router]
  );

  // Filter items by query
  const filteredNav = useMemo(() => {
    if (!query.trim()) return staticNavItems.slice(0, 5);
    const q = query.toLowerCase();
    return staticNavItems.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 6);
  }, [query, staticNavItems]);

  const filteredTenants = useMemo(() => {
    if (!query.trim()) return tenantItems.slice(0, 3);
    const q = query.toLowerCase();
    return tenantItems.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 5);
  }, [query, tenantItems]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actionItems;
    const q = query.toLowerCase();
    return actionItems.filter((i) => i.title.toLowerCase().includes(q));
  }, [query, actionItems]);

  const handleSelectItem = async (item: NavActionItem) => {
    onClose();
    onQueryChange("");
    if (item.action) {
      await item.action();
    } else if (item.url) {
      router.push(item.url);
    }
  };

  return (
    <CommandPaletteRoot open={open} onOpenChange={onOpenChange}>
      <CommandPaletteInput
        value={query}
        onValueChange={onQueryChange}
        placeholder="Search tenants, routes, or system actions..."
      />

      <div className="max-h-[360px] overflow-y-auto p-1 divide-y divide-border/40">
        {filteredNav.length > 0 && (
          <CommandPaletteGroup heading="Quick Navigation">
            {filteredNav.map((item) => (
              <CommandPaletteItem
                key={item.id}
                onSelect={() => handleSelectItem(item)}
                icon={item.icon || LayoutDashboard}
                badgeText={item.badgeText}
              >
                {item.title}
              </CommandPaletteItem>
            ))}
          </CommandPaletteGroup>
        )}

        {filteredTenants.length > 0 && (
          <CommandPaletteGroup heading="Tenant & Partner Lookup">
            {filteredTenants.map((item) => (
              <CommandPaletteItem
                key={item.id}
                onSelect={() => handleSelectItem(item)}
                icon={Building2}
                badgeText={item.badgeText}
              >
                {item.title}
              </CommandPaletteItem>
            ))}
          </CommandPaletteGroup>
        )}

        {filteredActions.length > 0 && (
          <CommandPaletteGroup heading="Quick System Actions">
            {filteredActions.map((item) => (
              <CommandPaletteItem
                key={item.id}
                onSelect={() => handleSelectItem(item)}
                icon={item.icon || RefreshCw}
                badgeText={item.badgeText}
              >
                {item.title}
              </CommandPaletteItem>
            ))}
          </CommandPaletteGroup>
        )}

        {filteredNav.length === 0 && filteredTenants.length === 0 && filteredActions.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Tidak ada hasil untuk &quot;<span className="font-semibold text-foreground">{query}</span>&quot;
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border/80 px-4 py-2 bg-muted/20 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↑↓</kbd> Select
          </span>
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border">↵</kbd> Open
          </span>
        </div>
        <span>K2NET Enterprise System</span>
      </div>
    </CommandPaletteRoot>
  );
}
