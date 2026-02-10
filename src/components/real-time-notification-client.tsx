"use client";

import { useRealTimeUpdates } from "@/hooks/use-real-time-updates";

/**
 * Empty client component that just initializes the real-time hook.
 * Inclusion in a layout ensures persistence across page navigations.
 */
export function RealTimeNotificationClient() {
  useRealTimeUpdates();
  return null;
}
