"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getBackendBaseUrl } from "@/lib/api-config";
import { toast } from "sonner";
import { useTaskStore } from "@/store/task-store";
import { useRouter } from "next/navigation";

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
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeEventSourceRef = useRef<EventSource | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const maxReconnects = 5;

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
          router.push(`/tasks/${eventPayload.id}`);
        },
      },
    });
  }, [incrementUnreadCount, router]);

  const connect = useCallback(() => {
    if (!session?.accessToken) {
      return;
    }

    const baseUrl = getBackendBaseUrl();
    // Pass the bearer token as a query parameter (supported via BearerTokenResolver in SecurityConfig)
    const sseUrl = `${baseUrl}/tasks/stream?access_token=${session.accessToken}`;

    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }

    try {
      console.log("[SSE-Task] Connecting to task stream...");
      const es = new EventSource(sseUrl);
      activeEventSourceRef.current = es;

      es.onopen = () => {
        console.log("[SSE-Task] Connection successfully established.");
        reconnectCountRef.current = 0; // Reset retry counter
      };

      es.addEventListener("TASK_CREATED", (e) => {
        try {
          const data: TaskEventPayload = JSON.parse(e.data);
          handleTaskCreated(data);
        } catch (err) {
          console.error("[SSE-Task] Failed to parse event payload:", err);
        }
      });

      es.onerror = (err) => {
        console.error("[SSE-Task] Connection error encountered:", err);
        es.close();
        activeEventSourceRef.current = null;

        // Exponential backoff reconnection logic
        if (reconnectCountRef.current < maxReconnects) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
          console.warn(`[SSE-Task] Retrying connection in ${delay}ms (Attempt ${reconnectCountRef.current + 1}/${maxReconnects})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, delay);
        } else {
          console.error("[SSE-Task] Max reconnection attempts reached. SSE stream disconnected.");
        }
      };
    } catch (err) {
      console.error("[SSE-Task] Failed to initialize EventSource:", err);
    }
  }, [session?.accessToken, handleTaskCreated]);

  useEffect(() => {
    connect();

    return () => {
      if (activeEventSourceRef.current) {
        activeEventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
}
