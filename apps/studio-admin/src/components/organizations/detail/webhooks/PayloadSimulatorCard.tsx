import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Textarea,
  ActionTooltip,
} from "@k2net/ui";
import {
  FlaskConical,
  Send,
  Copy,
  Sparkles,
  Terminal,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import type { EventSchema, SimulateEventResponse, WebhookEndpoint } from "./types";
import { PayloadSimulatorResult } from "./PayloadSimulatorResult";

interface PayloadSimulatorCardProps {
  eventSchemas: EventSchema[];
  endpoints: WebhookEndpoint[];
  loadingSchemas: boolean;
  onSimulateEvent: (data: {
    eventType: string;
    targetUrl: string;
    customPayloadJson?: string;
  }) => Promise<SimulateEventResponse>;
  onCopy: (text: string, label: string) => void;
}

export function PayloadSimulatorCard({
  eventSchemas,
  endpoints,
  loadingSchemas,
  onSimulateEvent,
  onCopy,
}: PayloadSimulatorCardProps) {
  const { canAccess } = usePermissions();
  const canManage = canAccess("system.organizations.webhooks.manage");

  const [selectedEventType, setSelectedEventType] = useState<string>("cable.fiber_cut");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [customPayload, setCustomPayload] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulateEventResponse | null>(null);

  const activeSchema = eventSchemas.find((s) => s.eventType === selectedEventType) || eventSchemas[0];

  const currentPayloadText =
    customPayload !== "" ? customPayload : activeSchema?.samplePayloadJson || "{}";

  const handleSelectEvent = (type: string) => {
    setSelectedEventType(type);
    setCustomPayload("");
    setSimulationResult(null);
  };

  const handleDispatch = async () => {
    if (!targetUrl.trim()) return;
    try {
      setIsSimulating(true);
      setSimulationResult(null);
      const res = await onSimulateEvent({
        eventType: selectedEventType,
        targetUrl: targetUrl.trim(),
        customPayloadJson: customPayload ? customPayload : undefined,
      });
      setSimulationResult(res);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <FlaskConical className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-foreground">Interactive Payload Simulator & Playground</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                DEVELOPER PLAYGROUND
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-[9px] font-mono gap-1">
                <ShieldCheck className="h-2.5 w-2.5 text-primary" />
                SSRF L2 PINNED
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Uji coba pengiriman JSON payload langsung ke server webhook tanpa harus menunggu alarm jaringan rill terjadi.
            </p>
          </div>
        </div>
      </div>

      {loadingSchemas ? (
        <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
          Memuat katalog schema event...
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {eventSchemas.map((schema) => (
              <button
                key={schema.eventType}
                type="button"
                onClick={() => handleSelectEvent(schema.eventType)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  schema.eventType === selectedEventType
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background border-border text-foreground hover:bg-muted"
                )}
              >
                <Sparkles className="h-3 w-3" />
                <span>{schema.displayName}</span>
                <span className="font-mono text-[10px] opacity-80">({schema.eventType})</span>
              </button>
            ))}
          </div>

          {activeSchema && (
            <div className="p-3 rounded-lg bg-background/50 border border-border/80 flex items-start gap-2.5">
              <div className="text-xs text-foreground flex-1">
                <strong>{activeSchema.displayName}</strong>: {activeSchema.description}
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-border text-muted-foreground">
                Kategori: {activeSchema.category}
              </Badge>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Target URL Tujuan Uji Coba (HTTPS)</span>
              <Badge variant="outline" className="text-[9px] font-mono border-primary/30 bg-primary/10 text-primary">
                SSRF L2 GUARDED (HTTPS ONLY)
              </Badge>
            </Label>
            <div className="flex gap-2">
              <Input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://noc.isp.net/webhook-receiver atau pilih tombol di bawah"
                className="h-9 text-xs font-mono bg-background border-border text-foreground flex-1"
              />
              {canManage ? (
                <Button
                  type="button"
                  onClick={handleDispatch}
                  disabled={!targetUrl.trim() || isSimulating}
                  className="h-9 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className={cn("h-3.5 w-3.5", isSimulating && "animate-pulse")} />
                  <span>{isSimulating ? "Mengirim..." : "Send Sample Payload"}</span>
                </Button>
              ) : (
                <ActionTooltip label="Akses Read-Only: Memerlukan izin system.organizations.webhooks.manage">
                  <span className="inline-block">
                    <Button
                      type="button"
                      disabled
                      className="h-9 px-4 text-xs font-medium bg-muted text-muted-foreground opacity-50 cursor-not-allowed gap-1.5 shrink-0"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Send Payload</span>
                    </Button>
                  </span>
                </ActionTooltip>
              )}
            </div>

            {endpoints.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-muted-foreground">Gunakan endpoint:</span>
                {endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => setTargetUrl(ep.targetUrl)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground hover:bg-muted/80 border border-border cursor-pointer"
                  >
                    {ep.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span>Sample JSON Payload Body (Dapat Dimodifikasi)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopy(currentPayloadText, "Sample JSON Payload")}
                  className="h-6 px-2 text-[10px] border-border gap-1 cursor-pointer"
                >
                  <Copy className="h-2.5 w-2.5" />
                  <span>Salin JSON</span>
                </Button>
                {customPayload !== "" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomPayload("")}
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Reset Template
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={currentPayloadText}
              onChange={(e) => setCustomPayload(e.target.value)}
              rows={9}
              className="font-mono text-[11px] leading-relaxed bg-background border-border text-foreground p-3 rounded-lg resize-y"
            />
          </div>

          <PayloadSimulatorResult result={simulationResult} />
        </div>
      )}
    </Card>
  );
}
