

import { useRealTimeUpdates } from "@/hooks/use-real-time-updates";
import { useParams } from "@/lib/navigation-compat";

/**
 * Empty client component that just initializes the real-time hook.
 * Inclusion in a layout ensures persistence across page navigations.
 */
export function RealTimeNotificationClient() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;
  
  useRealTimeUpdates(projectId);
  return null;
}
