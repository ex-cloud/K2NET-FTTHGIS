import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { EnrichedOrganization } from "../../types";
import type { WebhookDeliveryLog, WebhookSubscriptions, PingResult } from "./types";

export function useOrgWebhooksState(org: EnrichedOrganization) {
  const [apiKey, setApiKey] = useState(`k2_live_${org.slug}_8f9a2b7c4d1e0f3a`);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Webhook Form State
  const [webhookUrl, setWebhookUrl] = useState(`https://noc.isp-${org.slug}.net/api/v1/alerts/fiber-los`);
  const [webhookSecret, setWebhookSecret] = useState(`whsec_${org.slug}_992384a1`);
  const [subscribedEvents, setSubscribedEvents] = useState<WebhookSubscriptions>({
    fiberCut: true,
    oltDown: true,
    odpFull: true,
    quotaAlert: false,
  });

  const [testingPing, setTestingPing] = useState(false);
  const [lastPingResult, setLastPingResult] = useState<PingResult | null>(null);

  // Recent Delivery Logs
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([
    {
      id: "del-1",
      event: "cable.fiber_cut",
      targetUrl: `https://noc.isp-${org.slug}.net/api/v1/alerts/fiber-los`,
      status: 200,
      latencyMs: 42,
      timestamp: "2026-08-29 05:42 WIB",
    },
    {
      id: "del-2",
      event: "device.olt_heartbeat",
      targetUrl: `https://noc.isp-${org.slug}.net/api/v1/alerts/fiber-los`,
      status: 200,
      latencyMs: 38,
      timestamp: "2026-08-29 02:15 WIB",
    },
    {
      id: "del-3",
      event: "odp.capacity_warning",
      targetUrl: `https://noc.isp-${org.slug}.net/api/v1/alerts/fiber-los`,
      status: 200,
      latencyMs: 51,
      timestamp: "2026-08-28 14:10 WIB",
    },
  ]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard.`);
  }, []);

  const handleRegenerateKey = useCallback(() => {
    setIsRegenerating(true);
    setTimeout(() => {
      const newKey = `k2_live_${org.slug}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      setApiKey(newKey);
      setIsRegenerating(false);
      toast.success("API Key baru berhasil diterbitkan di Kong Gateway.", {
        description: "Pastikan untuk memperbarui API key pada script NOC tenant.",
      });
    }, 700);
  }, [org.slug]);

  const handleSaveWebhook = useCallback(() => {
    toast.success("Konfigurasi Webhook NOC berhasil disimpan.");
  }, []);

  const handleTestPing = useCallback(() => {
    setTestingPing(true);
    setTimeout(() => {
      const pingRes: PingResult = {
        status: 200,
        latencyMs: Math.floor(Math.random() * 25) + 35,
        timestamp: "Baru saja",
      };
      setLastPingResult(pingRes);
      setTestingPing(false);

      setDeliveryLogs((prev) => [
        {
          id: `del-${Date.now()}`,
          event: "ping.test_event",
          targetUrl: webhookUrl,
          status: 200,
          latencyMs: pingRes.latencyMs,
          timestamp: "Baru saja",
        },
        ...prev,
      ]);

      toast.success("Test Ping berhasil! Endpoint NOC merespons HTTP 200 OK.", {
        description: `Latency respon: ${pingRes.latencyMs} ms.`,
      });
    }, 800);
  }, [webhookUrl]);

  return {
    apiKey,
    showKey,
    setShowKey,
    isRegenerating,
    webhookUrl,
    setWebhookUrl,
    webhookSecret,
    setWebhookSecret,
    subscribedEvents,
    setSubscribedEvents,
    testingPing,
    lastPingResult,
    deliveryLogs,
    handleCopy,
    handleRegenerateKey,
    handleSaveWebhook,
    handleTestPing,
  };
}
