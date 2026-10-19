import { useState, useRef, useEffect, useCallback } from "react";
import { getBackendBaseUrl } from "@/lib/api-config";

export interface ProvisioningSuccessResult {
  organization?: Record<string, unknown>;
  adminPassword?: string;
  adminUsername?: string;
  slug?: string;
  id?: string;
  name?: string;
}

export interface StreamEventData {
  jobId: string;
  stage?: number;
  label?: string;
  detail?: string;
  durationMs?: number;
  status?: string;
  error?: string;
  result?: ProvisioningSuccessResult;
  timestamp?: string;
  currentStage?: number;
  stageDurations?: Record<number, number>;
}

async function resolveProvisioningStreamUrl(baseUrl: string, jobId: string, token: string): Promise<string> {
  let ticket: string | null = null;
  try {
    const ticketRes = await fetch(`${baseUrl}/auth/stream-ticket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (ticketRes.ok) {
      const ticketData = await ticketRes.json();
      if (ticketData?.ticket) {
        ticket = ticketData.ticket;
      }
    }
  } catch (ticketErr) {
    console.warn("[Provisioning] Could not fetch stream ticket, falling back to direct token:", ticketErr);
  }

  return ticket
    ? `${baseUrl}/organizations/provisioning/stream/${jobId}?ticket=${encodeURIComponent(ticket)}`
    : `${baseUrl}/organizations/provisioning/stream/${jobId}?access_token=${encodeURIComponent(token)}`;
}

interface PollStatusUpdate {
  currentStage?: number;
  stageDurations?: Record<number, number>;
  status?: string;
  result?: ProvisioningSuccessResult;
  error?: string;
}

function createProvisioningPollTimer(
  baseUrl: string,
  jobId: string,
  token: string,
  onUpdate: (data: PollStatusUpdate) => void
): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const statusRes = await fetch(`${baseUrl}/organizations/provisioning/status/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!statusRes.ok) return;
      const statusData: PollStatusUpdate = await statusRes.json();
      onUpdate(statusData);
    } catch (pollErr) {
      console.warn("Polling error:", pollErr);
    }
  }, 1500);
}

export function useWizardProvisioning() {
  const [provisioningStage, setProvisioningStage] = useState(1);
  const [stageDurations, setStageDurations] = useState<Record<number, number>>({});
  const [stageDetails, setStageDetails] = useState<Record<number, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const abortStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      abortStreaming();
    };
  }, [abortStreaming]);

  const resetProvisioningState = useCallback(() => {
    abortStreaming();
    setProvisioningStage(1);
    setStageDurations({});
    setStageDetails({});
    setStreamError(null);
  }, [abortStreaming]);

  const startStreamingProvisioning = useCallback(
    async ({
      jobId,
      token,
      onSuccess,
      onError,
    }: {
      jobId: string;
      token: string;
      onSuccess: (result: ProvisioningSuccessResult) => void;
      onError: (err: { stage: number; message: string }) => void;
    }) => {
      abortStreaming();
      setIsStreaming(true);
      setStreamError(null);
      setProvisioningStage(1);
      setStageDurations({});
      setStageDetails({});

      const baseUrl = getBackendBaseUrl();
      const streamUrl = await resolveProvisioningStreamUrl(baseUrl, jobId, token);

      try {
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.addEventListener("INIT", (event: MessageEvent) => {
          try {
            const data: StreamEventData = JSON.parse(event.data);
            if (data.currentStage && data.currentStage > 0) {
              setProvisioningStage(data.currentStage);
            }
            if (data.stageDurations) {
              setStageDurations((prev) => ({ ...prev, ...data.stageDurations }));
            }
            if (data.status === "COMPLETED" && data.result) {
              abortStreaming();
              setProvisioningStage(5);
              onSuccess(data.result);
            } else if (data.status === "FAILED") {
              abortStreaming();
              const errMsg = data.error || "Provisioning failed during execution";
              setStreamError(errMsg);
              onError({ stage: data.stage || 1, message: errMsg });
            }
          } catch (e) {
            console.warn("Failed to parse INIT event payload:", e);
          }
        });

        es.addEventListener("STAGE_STARTED", (event: MessageEvent) => {
          try {
            const data: StreamEventData = JSON.parse(event.data);
            if (typeof data.stage === "number") {
              setProvisioningStage(data.stage);
              if (data.detail) {
                setStageDetails((prev) => ({ ...prev, [data.stage!]: data.detail! }));
              }
            }
          } catch (e) {
            console.warn("Failed to parse STAGE_STARTED event payload:", e);
          }
        });

        es.addEventListener("STAGE_COMPLETED", (event: MessageEvent) => {
          try {
            const data: StreamEventData = JSON.parse(event.data);
            if (typeof data.stage === "number") {
              if (typeof data.durationMs === "number") {
                setStageDurations((prev) => ({ ...prev, [data.stage!]: data.durationMs! }));
              }
              if (data.detail) {
                setStageDetails((prev) => ({ ...prev, [data.stage!]: data.detail! }));
              }
              // Advance to next stage preview
              setProvisioningStage((prev) => Math.max(prev, data.stage! + 1));
            }
          } catch (e) {
            console.warn("Failed to parse STAGE_COMPLETED event payload:", e);
          }
        });

        es.addEventListener("PROVISIONING_SUCCESS", (event: MessageEvent) => {
          try {
            const data: StreamEventData = JSON.parse(event.data);
            abortStreaming();
            setProvisioningStage(5);
            onSuccess(data.result || {});
          } catch (e) {
            console.warn("Failed to parse PROVISIONING_SUCCESS event payload:", e);
            abortStreaming();
            setProvisioningStage(5);
            onSuccess({});
          }
        });

        es.addEventListener("PROVISIONING_FAILED", (event: MessageEvent) => {
          try {
            const data: StreamEventData = JSON.parse(event.data);
            abortStreaming();
            const errMsg = data.error || "Provisioning failed during execution";
            setStreamError(errMsg);
            onError({ stage: data.stage || 1, message: errMsg });
          } catch (_e) {
            abortStreaming();
            setStreamError("Provisioning failed during execution");
            onError({ stage: 1, message: "Provisioning failed" });
          }
        });

        es.onerror = () => {
          console.warn("SSE connection interrupted. Falling back to HTTP status polling...");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }

          if (!pollTimerRef.current) {
            pollTimerRef.current = createProvisioningPollTimer(baseUrl, jobId, token, (statusData) => {
              if (statusData.currentStage) {
                setProvisioningStage(statusData.currentStage);
              }
              if (statusData.stageDurations) {
                setStageDurations((prev) => ({ ...prev, ...statusData.stageDurations }));
              }
              if (statusData.status === "COMPLETED") {
                abortStreaming();
                setProvisioningStage(5);
                onSuccess(statusData.result || {});
              } else if (statusData.status === "FAILED") {
                abortStreaming();
                const errMsg = statusData.error || "Provisioning failed during execution";
                setStreamError(errMsg);
                onError({ stage: statusData.currentStage || 1, message: errMsg });
              }
            });
          }
        };
      } catch (err) {
        console.error("Failed to initialize SSE stream:", err);
        setStreamError(err instanceof Error ? err.message : "Failed to connect to provisioning stream");
        onError({ stage: 1, message: err instanceof Error ? err.message : "Failed to connect" });
        setIsStreaming(false);
      }
    },
    [abortStreaming]
  );

  return {
    provisioningStage,
    setProvisioningStage,
    stageDurations,
    stageDetails,
    isStreaming,
    streamError,
    startStreamingProvisioning,
    abortStreaming,
    resetProvisioningState,
  };
}
