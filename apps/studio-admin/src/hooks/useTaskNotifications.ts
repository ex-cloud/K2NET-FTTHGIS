

import { useEffect, useRef, useCallback } from "react";
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
 */
export function useTaskNotifications() {
  const { data: session } = useSession();
  const router = useRouter();
  const incrementUnreadCount = useTaskStore((state) => state.incrementUnreadCount);
  
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeEventSourceRef = useRef<EventSource | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const maxReconnects = 5;
  const isConnectingRef = useRef<boolean>(false);

  const handleTaskCreated = useCallback((eventPayload: TaskEventPayload) => {
    // 1. Increment the unread B2B counter in store
    incrementUnreadCount();

    // 2. Display an interactive toast notification with action link
    const refText = eventPayload.obsidianRef ? ` (${eventPayload.obsidianRef})` : "";
    
    toast.info("🎫 Tiket B2B Baru Masuk", {
      description: `${eventPayload.title}${refText}`,
      duration: 8000,
      action: {
        label: "Buka",
        onClick: () => {
          routerRef.current?.push(`/tasks/${eventPayload.id}`);
        },
      },
    });
  }, [incrementUnreadCount]);

  const connect = useCallback(() => {
    if (!session?.accessToken || isConnectingRef.current) {
      return;
    }

    if (activeEventSourceRef.current && activeEventSourceRef.current.readyState === EventSource.OPEN) {
      return;
    }

    const baseUrl = getBackendBaseUrl();
    const sseUrl = `${baseUrl}/tasks/stream?access_token=${session.accessToken}`;

    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }

    try {
      isConnectingRef.current = true;
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

        // Exponential backoff reconnection logic (max 5 times)
        if (reconnectCountRef.current < maxReconnects) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

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
  }, [session?.accessToken, handleTaskCreated]);

  useEffect(() => {
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
    };
  }, [connect]);
}
