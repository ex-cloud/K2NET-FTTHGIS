import { useState } from "react";
import {
  Badge,
  Button,
  Card,
} from "@k2net/ui";
import {
  Network,
  Plus,
} from "lucide-react";
import type { WebhookEndpoint, WebhookSubscriptions, PingResult } from "./types";
import { EndpointModal } from "./EndpointModal";
import { EndpointRowItem } from "./EndpointRowItem";

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
  onTestPingEndpoint: (id: string) => Promise<PingResult>;
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

  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});
  const [rollingSecretId, setRollingSecretId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingEndpoint(null);
    setIsModalOpen(true);
  };

  const openEditModal = (ep: WebhookEndpoint) => {
    setEditingEndpoint(ep);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: {
    name: string;
    targetUrl: string;
    description: string;
    subscribedEvents: WebhookSubscriptions;
    isActive: boolean;
  }) => {
    if (editingEndpoint) {
      await onUpdateEndpoint(editingEndpoint.id, data);
    } else {
      await onCreateEndpoint(data);
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
            {endpoints.map((ep) => (
              <EndpointRowItem
                key={ep.id}
                endpoint={ep}
                pingResult={pingResults[ep.id]}
                isPinging={pingingId === ep.id}
                isRolling={rollingSecretId === ep.id}
                isDeleting={deletingId === ep.id}
                onTestPing={handleTestPing}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onRollSecret={handleRollSecret}
                onCopy={onCopy}
              />
            ))}
          </div>
        )}
      </div>

      <EndpointModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingEndpoint={editingEndpoint}
        onSubmit={handleModalSubmit}
      />
    </Card>
  );
}
