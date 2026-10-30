import * as React from "react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { toast } from "sonner";
import { useTranslation } from "@k2net/i18n";

export function App() {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let offlineToastId: string | number | undefined;

    const handleOffline = () => {
      offlineToastId = toast.warning(t("common.network_disconnected"), {
        description: t("common.network_disconnected_desc"),
        duration: Infinity,
      });
    };

    const handleOnline = () => {
      if (offlineToastId) {
        toast.dismiss(offlineToastId);
      }
      toast.success(t("common.network_reconnected"), {
        description: t("common.network_reconnected_desc"),
        duration: 4000,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [t]);

  return <RouterProvider router={router} />;
}
