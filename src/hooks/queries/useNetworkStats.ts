import { useQuery } from "@tanstack/react-query";
import { networkApi } from "@/lib/api/network";

export function useNetworkStats(token: string | undefined, projectId: string) {
  return useQuery({
    queryKey: ["networkStats", projectId],
    queryFn: () => networkApi.getStats(token as string, projectId),
    // Only fetch if we have a token and projectId
    enabled: !!token && !!projectId,
    // Refetch in background every 30 seconds to keep dashboard fresh
    refetchInterval: 30000,
  });
}
