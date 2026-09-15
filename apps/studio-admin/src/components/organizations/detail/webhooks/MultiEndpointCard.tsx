import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@k2net/ui";
import {
  Network,
  Plus,
  Send,
  RefreshCw,
  Lock,
  Trash2,
  Edit2,
  CheckCircle2,
  Copy,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebhookEndpoint, WebhookSubscriptions } from "./types";

interface MultiEndpointCardProps {
  endpoints: WebhookEndpoint[];
  loadingEndpoints: boolean;
  onCreateEndpoint: (data: {
    name: string;
    targetUrl: string;
    description: string;
    subscribedEvents: WebhookSubscriptions;
    isActive: boolean;
  }) => Promise<void>;
  onUpdateEndpoint: (
    id: string,
    data: {
      name: string;
      targetUrl: string;
      description: string;
      subscribedEvents: WebhookSubscriptions;
      isActive: boolean;
    }
  ) => Promise<void>;
  onDeleteEndpoint: (id: string) => Promise<void>;
  onRollEndpointSecret: (id: string) => Promise<void>;
  onTestPingEndpoint: (id: string) => Promise<{ status: number; latencyMs: number; success: boolean; errorMessage?: string }>;
  onCopy: (text: string, label: string) => void;
}

export function MultiEndpointCard({
  endpoints,
  loadingEndpoints,
  onCreateEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onRollEndpointSecret,
  onTestPingEndpoint,
  onCopy,
}: MultiEndpointCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [subscribedEvents, setSubscribedEvents] = useState<WebhookSubscriptions>({
    fiberCut: true,
    oltDown: true,
    odpFull: false,
    quotaAlert: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ping testing state per endpoint
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { status: number; latencyMs: number; success: boolean; errorMessage?: string }>>({});
  const [rollingSecretId, setRollingSecretId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingEndpoint(null);
    setName("");
    setTargetUrl("");
    setDescription("");
    setIsActive(true);
    setSubscribedEvents({
      fiberCut: true,
      oltDown: true,
      odpFull: false,
      quotaAlert: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ep: WebhookEndpoint) => {
    setEditingEndpoint(ep);
    setName(ep.name);
    setTargetUrl(ep.targetUrl);
    setDescription(ep.description || "");
    setIsActive(ep.isActive);
    setSubscribedEvents(ep.subscribedEvents);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !targetUrl.trim()) return;
    try {
      setIsSubmitting(true);
      if (editingEndpoint) {
        await onUpdateEndpoint(editingEndpoint.id, {
          name: name.trim(),
          targetUrl: targetUrl.trim(),
          description: description.trim(),
          subscribedEvents,
          isActive,
        });
      } else {
        await onCreateEndpoint({
          name: name.trim(),
          targetUrl: targetUrl.trim(),
          description: description.trim(),
          subscribedEvents,
          isActive,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestPing = async (id: string) => {
    try {
      setPingingId(id);
      const res = await onTestPingEndpoint(id);
      setPingResults((prev) => ({ ...prev, [id]: res }));
    } finally {
      setPingingId(null);
    }
  };

  const handleRollSecret = async (id: string) => {
    try {
      setRollingSecretId(id);
      await onRollEndpointSecret(id);
    } finally {
      setRollingSecretId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus endpoint webhook ini secara permanen? Log pengiriman sebelumnya tetap tersimpan.")) {
      return;
    }
    try {
      setDeletingId(id);
      await onDeleteEndpoint(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-5 space-y-4 bg-card border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Network className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-foreground">Multi-Endpoint Webhook Router</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[9px] font-mono">
                {endpoints.filter((e) => e.isActive).length} ACTIVE DESTINATIONS
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Kirim sinyal event ke berbagai sistem tujuan secara independen (NOC Discord, Telegram Bot, CRM Billing).
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          className="h-7 px-2.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="h-3 w-3" />
          <span>Add Webhook Endpoint</span>
        </Button>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3 pt-1">
        {loadingEndpoints ? (
          <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
            Memuat daftar endpoint webhook...
          </div>
        ) : endpoints.length === 0 ? (
          <div className="p-6 rounded-lg border border-dashed border-border bg-background/50 text-center space-y-2">
            <Network className="h-6 w-6 text-muted-foreground mx-auto" />
            <div className="text-xs font-medium text-foreground">Belum ada Webhook Endpoint Tambahan</div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Tambahkan endpoint tujuan untuk memisahkan notifikasi alarm kritis NOC dengan notifikasi billing atau status pelanggan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {endpoints.map((ep) => {
              const pingResult = pingResults[ep.id];
              const isPinging = pingingId === ep.id;
              const isRolling = rollingSecretId === ep.id;
              const isDeleting = deletingId === ep.id;

              return (
                <div
                  key={ep.id}
                  className="p-4 rounded-xl border border-border/80 bg-background/40 hover:bg-muted/20 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{ep.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono",
                          ep.isActive
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        {ep.isActive ? "ACTIVE" : "PAUSED"}
                      </Badge>

                      {pingResult && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono",
                            pingResult.success
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          )}
                        >
                          Ping: {pingResult.status} ({pingResult.latencyMs}ms)
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestPing(ep.id)}
                        disabled={isPinging || !ep.isActive}
                        className="h-7 px-2 text-xs border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
                        title="Uji kirim ping ke endpoint ini"
                      >
                        <Send className={cn("h-3 w-3 text-primary", isPinging && "animate-pulse")} />
                        <span>{isPinging ? "Pinging..." : "Test Ping"}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(ep)}
                        className="h-7 px-2 text-xs border-border text-foreground hover:bg-muted gap-1 cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ep.id)}
                        disabled={isDeleting}
                        className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Target URL & Description */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-foreground px-2 py-1 rounded bg-background border border-border select-all flex-1 truncate">
                        {ep.targetUrl}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onCopy(ep.targetUrl, "Target URL")}
                        className="h-7 px-2 border-border text-xs"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {ep.description && (
                      <p className="text-[11px] text-muted-foreground">{ep.description}</p>
                    )}
                  </div>

                  {/* Subscribed Events Badges & HMAC Secret */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">Events:</span>
                      {ep.subscribedEvents.fiberCut && (
                        <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
                          cable.fiber_cut
                        </Badge>
                      )}
                      {ep.subscribedEvents.oltDown && (
                        <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
                          device.olt_down
                        </Badge>
                      )}
                      {ep.subscribedEvents.odpFull && (
                        <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
                          odp.capacity_full
                        </Badge>
                      )}
                      {ep.subscribedEvents.quotaAlert && (
                        <Badge variant="outline" className="text-[9px] font-mono bg-background border-border text-foreground">
                          tenant.quota_warning
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground font-mono">
                        HMAC: {ep.secretMasked || "whsec_••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRollSecret(ep.id)}
                        disabled={isRolling}
                        className="h-6 px-1.5 text-[10px] text-primary hover:text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                      >
                        <RefreshCw className={cn("h-2.5 w-2.5", isRolling && "animate-spin")} />
                        <span>Roll Secret</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Endpoint Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border shadow-lg p-6 space-y-4">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Network className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  {editingEndpoint ? "Edit Webhook Endpoint" : "Tambah Webhook Endpoint Baru"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Konfigurasikan URL penerima webhook dan pilih kategori event yang ingin dikirimkan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 pt-1">
            {/* Endpoint Name */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Nama Endpoint</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: NOC Incident Discord, Telegram Alert Bot"
                className="h-9 text-xs bg-background border-border text-foreground"
              />
            </div>

            {/* Target URL */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Webhook URL (HTTPS)</span>
                <span className="text-[10px] text-muted-foreground font-normal">SSRF Protected</span>
              </Label>
              <Input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://api.noc-tools.com/incoming-alarm"
                className="h-9 text-xs font-mono bg-background border-border text-foreground"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Deskripsi / Catatan Integrasi</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opsional: Tujuan penggunaan webhook ini"
                className="h-9 text-xs bg-background border-border text-foreground"
              />
            </div>

            {/* Subscribed Events */}
            <div className="space-y-2 pt-1 border-t border-border/60">
              <Label className="text-xs font-semibold text-foreground">Langganan Event</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                  <Checkbox
                    id="ep-fiber-cut"
                    checked={subscribedEvents.fiberCut}
                    onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, fiberCut: !!c }))}
                  />
                  <Label htmlFor="ep-fiber-cut" className="text-xs text-foreground cursor-pointer">
                    cable.fiber_cut
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                  <Checkbox
                    id="ep-olt-down"
                    checked={subscribedEvents.oltDown}
                    onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, oltDown: !!c }))}
                  />
                  <Label htmlFor="ep-olt-down" className="text-xs text-foreground cursor-pointer">
                    device.olt_down
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                  <Checkbox
                    id="ep-odp-full"
                    checked={subscribedEvents.odpFull}
                    onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, odpFull: !!c }))}
                  />
                  <Label htmlFor="ep-odp-full" className="text-xs text-foreground cursor-pointer">
                    odp.capacity_full
                  </Label>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border">
                  <Checkbox
                    id="ep-quota-alert"
                    checked={subscribedEvents.quotaAlert}
                    onCheckedChange={(c) => setSubscribedEvents((prev) => ({ ...prev, quotaAlert: !!c }))}
                  />
                  <Label htmlFor="ep-quota-alert" className="text-xs text-foreground cursor-pointer">
                    tenant.quota_warning
                  </Label>
                </div>
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="ep-active"
                checked={isActive}
                onCheckedChange={(c) => setIsActive(!!c)}
              />
              <Label htmlFor="ep-active" className="text-xs font-semibold text-foreground cursor-pointer">
                Aktifkan pengiriman webhook ke endpoint ini
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="h-8 text-xs border-border"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || !targetUrl.trim() || isSubmitting}
              className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Menyimpan..." : editingEndpoint ? "Simpan Perubahan" : "Buat Endpoint"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
