import * as React from "react";
import {
  Bell,
  AlertTriangle,
  Server,
  Users,
  CheckCheck,
  X,
  Clock,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  Button,
  Badge,
} from "@k2net/ui";

interface NotificationItem {
  id: string;
  type: "warning" | "success" | "info";
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: "optical" | "system" | "customer";
}

interface TenantNotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenantNotificationsSheet({
  open,
  onOpenChange,
}: TenantNotificationsSheetProps) {
  const [filter, setFilter] = React.useState<"all" | "optical" | "system">("all");
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: "notif-1",
      type: "warning",
      title: "Peringatan Redaman Kritis",
      description: "Pelanggan Rina Wijaya (ODP-JKT-018 #7) mengalami degradasi sinyal optik menjadi -27.8 dBm.",
      time: "5 menit lalu",
      read: false,
      category: "optical",
    },
    {
      id: "notif-2",
      type: "success",
      title: "Telemetri OLT Stabil",
      description: "Seluruh 4 unit OLT merespons SNMP polling dengan average latency 14ms.",
      time: "24 menit lalu",
      read: false,
      category: "system",
    },
    {
      id: "notif-3",
      type: "info",
      title: "Aktivasi Pelanggan Baru",
      description: "Provisioning PPPoE budi.santoso@net pada port ODP-JKT-012 #3 berhasil diaktifkan.",
      time: "1 jam lalu",
      read: true,
      category: "customer",
    },
    {
      id: "notif-4",
      type: "warning",
      title: "Utilitas Port FAT Mendekati 90%",
      description: "ODP-JKT-004 telah terisi 7 dari 8 port. Disarankan ekspansi ODP split kedua.",
      time: "3 jam lalu",
      read: true,
      category: "optical",
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.category === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between border-b border-border/40 px-4 bg-background shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/30">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">Pusat Notifikasi</span>
              {unreadCount > 0 && (
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-mono px-1.5 py-0">
                  {unreadCount} BARU
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                title="Tandai Semua Dibaca"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Baca Semua</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 p-2.5 border-b border-border/40 bg-muted/20 shrink-0">
          {[
            { key: "all", label: "Semua" },
            { key: "optical", label: "Redaman Optik" },
            { key: "system", label: "Sistem & OLT" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs">Tidak ada notifikasi dalam kategori ini.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 space-y-1.5 transition-colors ${
                  item.read ? "bg-background hover:bg-muted/20" : "bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.category === "optical" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    ) : item.category === "system" ? (
                      <Server className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Users className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs font-bold ${item.read ? "text-foreground/90" : "text-foreground"}`}>
                      {item.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    {item.time}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed pl-5.5">
                  {item.description}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
