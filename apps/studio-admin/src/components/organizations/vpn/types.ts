export interface VpnTunnelInfo {
  orgId: string;
  orgName: string;
  orgSlug: string;
  protocol: "WireGuard" | "Tailscale";
  virtualIp: string;
  brasGateway: string;
  latencyMs: number;
  throughputRx: string;
  throughputTx: string;
  status: "ONLINE" | "CONNECTING" | "OFFLINE";
  advertisedSubnets: string[];
}
