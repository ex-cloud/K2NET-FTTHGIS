import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-compat";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { useTaskStore } from "@/store/task-store";
import { useRouter } from "@/lib/navigation-compat";

interface TaskEventPayload {
  id: string;
  obsidianRef: string;
  title: string;
  scope: string;
  type: string;
  createdAt: string;
}

/**
 * Hook to subscribe to the real-time Task SSE stream.
 * Automatically reconnects with exponential backoff on connection drops.
 * Updates the global unread B2B ticket counter in the Zustand store and displays interactive toasts.
 *
 * CSR SPA note: All callback refs are stored in useRef to prevent the EventSource
 * from being torn down and recreated on every render/navigation. The SSE connection
 * is established once when the access token is available, and only closed on
 * component unmount or when the token changes.
 */
export function useTaskNotifications() {
  const { data: session } = useSession();
  const router = useRouter();

  // ── Stable refs for callbacks (prevents closing/reopening SSE on every render) ──
  const routerRef = useRef(router);
  const incrementUnreadCountRef = useRef(useTaskStore.getState().incrementUnreadCount);
  const accessTokenRef = useRef(session?.accessToken);

  // Keep refs in sync without triggering re-renders
  useEffect(() => { routerRef.current = router; });
  useEffect(() => { accessTokenRef.current = session?.accessToken; });
  // Sync incrementUnreadCount ref directly from Zustand store to avoid
  // subscribe/unsubscribe cycles that destabilize the connect callback
  useEffect(() => {
    return useTaskStore.subscribe((state) => {
      incrementUnreadCountRef.current = state.incrementUnreadCount;
    });
  }, []);

  // ── SSE connection state (refs only — no state to avoid re-renders) ────────
  const activeEventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  const maxReconnects = 5;

  // ── Main effect: open SSE when token arrives, close on unmount/token change ──
  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;

    function handleTaskCreated(eventPayload: TaskEventPayload) {
      incrementUnreadCountRef.current?.();
      const refText = eventPayload.obsidianRef ? ` (${eventPayload.obsidianRef})` : "";
      toast.info("🎫 Tiket B2B Baru Masuk", {
        description: `${eventPayload.title}${refText}`,
        duration: 8000,
        action: {
          label: "Buka",
          onClick: () => routerRef.current?.push(`/tasks/${eventPayload.id}`),
        },
      });
    }

    function connect() {
      if (isConnectingRef.current) return;
      if (
        activeEventSourceRef.current &&
        activeEventSourceRef.current.readyState === EventSource.OPEN
      ) return;

      if (activeEventSourceRef.current) {
        activeEventSourceRef.current.close();
        activeEventSourceRef.current = null;
      }

      try {
        isConnectingRef.current = true;
        const baseUrl = getBackendBaseUrl();
        // Use ref to always get the latest token without closing SSE on token refresh
        const sseUrl = `${baseUrl}/tasks/stream?access_token=${accessTokenRef.current}`;
        const es = new EventSource(sseUrl);
        activeEventSourceRef.current = es;

        es.onopen = () => {
          isConnectingRef.current = false;
          reconnectCountRef.current = 0;
        };

        es.addEventListener("TASK_CREATED", (e) => {
          try {
            const data: TaskEventPayload = JSON.parse(e.data);
            handleTaskCreated(data);
          } catch (err) {
            console.error("[SSE-Task] Failed to parse event payload:", err);
          }
        });

        es.onerror = () => {
          isConnectingRef.current = false;
          es.close();
          activeEventSourceRef.current = null;

          if (reconnectCountRef.current < maxReconnects) {
            const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectCountRef.current += 1;
              connect();
            }, delay);
          }
        };
      } catch (err) {
        isConnectingRef.current = false;
        console.error("[SSE-Task] Failed to initialize EventSource:", err);
      }
    }

    connect();

    return () => {
      if (activeEventSourceRef.current) {
        activeEventSourceRef.current.close();
        activeEventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isConnectingRef.current = false;
      reconnectCountRef.current = 0;
    };
    // Only re-establish SSE when the actual token changes (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);
}
