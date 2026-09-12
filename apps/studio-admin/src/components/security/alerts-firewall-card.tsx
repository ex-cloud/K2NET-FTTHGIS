import { Plus, Trash2, Copy, Sparkles, ShieldAlert as ShieldIcon } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  ActionTooltip,
  UniversalContextMenu,
  type ContextMenuGroupConfig,
} from "@k2net/ui";
import { toast } from "sonner";
import type { BlockedIpDto } from "@/hooks/useSecuritySettings";

interface AlertsFirewallCardProps {
  ipInput: string;
  setIpInput: (val: string) => void;
  reasonInput: string;
  setReasonInput: (val: string) => void;
  handleBlockIp: (e: React.FormEvent) => void;
  isBlockingIp: boolean;
  loadingBlockedIps: boolean;
  blockedIps: BlockedIpDto[];
  handleUnblockIp: (id: number) => void;
}

export function AlertsFirewallCard({
  ipInput,
  setIpInput,
  reasonInput,
  setReasonInput,
  handleBlockIp,
  isBlockingIp,
  loadingBlockedIps,
  blockedIps,
  handleUnblockIp,
}: AlertsFirewallCardProps) {
  const getFirewallContextMenuGroups = (rule: BlockedIpDto): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI Evaluasi Rule Firewall",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Evaluasi rule firewall IP/CIDR: ${rule.ipAddressOrCidr}. Alasan pemblokiran: ${rule.reason}. Apakah subnet atau IP ini aman untuk di-unblock atau perlu dipertahankan?`,
                },
              })
            );
            window.dispatchEvent(new CustomEvent("k2net-toggle-ai-assistant"));
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Salin IP / Subnet CIDR",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(rule.ipAddressOrCidr || "");
            toast.success(`IP ${rule.ipAddressOrCidr} disalin!`);
          },
        },
        {
          label: "Salin Alasan Blokir",
          icon: ShieldIcon,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(rule.reason || "");
            toast.success(`Alasan disalin!`);
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Buka Blokir IP (Hapus Rule)",
          icon: Trash2,
          shortcut: "Del",
          onClick: () => handleUnblockIp(rule.id),
        },
      ],
    },
  ];

  return (
    <Card glowingEffect className="bg-card/30 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
          <ShieldIcon className="w-4 h-4 text-primary" /> Firewall Block List
        </CardTitle>
        <CardDescription className="text-muted-foreground text-xs">
          Create high-performance low-level IP/CIDR filters to deny network handshake early.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <form onSubmit={handleBlockIp} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="block_ip" className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
              IP Address / CIDR Range
            </Label>
            <Input
              id="block_ip"
              placeholder="e.g. 103.111.12.5 or 192.168.1.0/24"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              className="bg-background/60 border-border text-foreground text-xs h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="block_reason" className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
              Block Reason
            </Label>
            <Input
              id="block_reason"
              placeholder="Reason for suspension"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              className="bg-background/60 border-border text-foreground text-xs h-9"
            />
          </div>
          <ActionTooltip label="Tambahkan Rule Blokir Firewall" shortcut="Enter">
            <Button
              type="submit"
              disabled={isBlockingIp}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 font-medium transition-all shadow-md gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Block Network IP
            </Button>
          </ActionTooltip>
        </form>

        <div className="border-t border-border pt-4">
          <Label className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block mb-2">
            Active Rules ({blockedIps.length})
          </Label>

          {loadingBlockedIps ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full bg-muted" />
              <Skeleton className="h-10 w-full bg-muted" />
            </div>
          ) : blockedIps.length === 0 ? (
            <div className="text-center p-4 border border-dashed border-border rounded-lg bg-background/20 text-muted-foreground text-xs">
              No IP blocking rules configured.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-border rounded-lg bg-background/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                    <th className="p-2 font-medium">IP/CIDR</th>
                    <th className="p-2 font-medium">Reason</th>
                    <th className="p-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedIps.map((rule) => (
                    <UniversalContextMenu key={rule.id} groups={getFirewallContextMenuGroups(rule)}>
                      <tr className="border-b border-border/40 text-muted-foreground hover:bg-muted/10 cursor-context-menu">
                        <td className="p-2 font-mono text-[10px] text-foreground">{rule.ipAddressOrCidr}</td>
                        <td className="p-2 text-[10px] text-muted-foreground max-w-[120px] truncate" title={rule.reason}>
                          {rule.reason}
                        </td>
                        <td className="p-2 text-right">
                          <ActionTooltip label="Buka Blokir IP" shortcut="Del">
                            <button
                              onClick={() => handleUnblockIp(rule.id)}
                              className="text-rose-400 hover:text-rose-300 p-1 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </ActionTooltip>
                        </td>
                      </tr>
                    </UniversalContextMenu>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
