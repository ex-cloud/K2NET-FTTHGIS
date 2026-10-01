import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@k2net/i18n";

export function NetworkStatusIndicator() {
  const { t } = useTranslation();
  const [_isOnline, setIsOnline] = useState<boolean>(true);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      setShowBanner(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      toast.success(t("common.network_reconnected"), {
        description: t("common.network_reconnected_desc"),
        icon: <Wifi className="h-4 w-4 text-primary" />,
        duration: 4000,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
      toast.error(t("common.network_disconnected"), {
        description: t("common.network_disconnected_desc"),
        icon: <WifiOff className="h-4 w-4 text-destructive" />,
        duration: 6000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [t]);

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2.5 px-4 py-2 rounded-full shadow-lg backdrop-blur-md",
        "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs",
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <WifiOff className="h-3.5 w-3.5" />
      <span>{t("common.offline_mode_waiting")}</span>
    </div>
  );
}
