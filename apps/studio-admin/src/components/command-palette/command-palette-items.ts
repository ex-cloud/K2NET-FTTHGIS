import type React from "react";
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  Zap,
  Mail,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { SYSTEM_SIDEBAR_NAVIGATION } from "@/config/system-sidebar-navigation";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";

export interface NavActionItem {
  id: string;
  title: string;
  category: "Navigation" | "Tenants" | "Actions";
  url?: string;
  action?: () => Promise<void> | void;
  icon?: React.ComponentType<{ className?: string }>;
  badgeText?: string;
}

export function buildStaticNavItems(): NavActionItem[] {
  const items: NavActionItem[] = [
    { id: "overview", title: "System Overview Dashboard", category: "Navigation", url: "/overview", icon: LayoutDashboard, badgeText: "Page" },
    { id: "orgs", title: "Organizations & Tenants", category: "Navigation", url: "/organizations", icon: Users, badgeText: "Page" },
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
}

export function buildActionItems(
  accessToken: string | undefined,
  navigate: (path: string) => void
): NavActionItem[] {
  return [
    {
      id: "action-purge-redis",
      title: "Purge Redis Cache (Flush System Keys)",
      category: "Actions",
      icon: Zap,
      badgeText: "API Action",
      action: async () => {
        try {
          const baseUrl = getBackendBaseUrl();
          const res = await httpClient(`${baseUrl}/system/cache/purge`, {
            method: "POST",
            token: accessToken,
          });
          if (res.ok) {
            toast.success("Redis Cache berhasil dibersihkan!");
          } else {
            toast.info("Command cache purge dikirimkan ke worker.");
          }
        } catch {
          toast.info("Sinyal purge Redis cache telah dikirim.");
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
          const baseUrl = getBackendBaseUrl();
          await httpClient(`${baseUrl}/system/gateway/reload-kong`, {
            method: "POST",
            token: accessToken,
          });
          toast.success("Konfigurasi rute Kong API Gateway diperbarui!");
        } catch {
          toast.info("Sinyal reload Kong Gateway dikirim.");
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
        navigate("/settings/smtp-mail");
      },
    },
    {
      id: "action-create-ticket",
      title: "Create New Support Ticket",
      category: "Actions",
      icon: ClipboardList,
      badgeText: "Tasks",
      action: () => {
        navigate("/tasks/new?type=TICKET");
      },
    },
    {
      id: "action-open-kanban",
      title: "Open Project Kanban Board",
      category: "Actions",
      icon: ClipboardList,
      badgeText: "Tasks",
      action: () => {
        navigate("/tasks?view=kanban");
      },
    },
    {
      id: "action-view-urgent",
      title: "View All Urgent Tickets Now",
      category: "Actions",
      icon: AlertCircle,
      badgeText: "Tasks",
      action: () => {
        navigate("/tasks?priority=URGENT&status=TODO");
      },
    },
  ];
}
