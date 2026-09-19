import { 
  ShieldCheck, 
  ArrowUpRight, 
  Info, 
  ShieldAlert, 
  KeyRound, 
  UserCheck, 
  Trash2, 
  RefreshCw, 
  Bot, 
  AlertTriangle,
  Building,
  RotateCcw,
  Download,
  Settings,
  Activity,
  Lock,
  CheckSquare,
  FileCode,
  Sparkles,
  Flame
} from "lucide-react";
import { Link } from "@/lib/navigation-compat";
import { Button } from "@k2net/ui";
import { cn } from "@/lib/utils";
import type { SecurityAuditItem } from "../recent-operations-types";

interface SecurityAuditTabProps {
  items: SecurityAuditItem[];
  loading: boolean;
}

function getSeverityMeta(severity: string) {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL")
    return {
      emoji: "🔴",
      label: "CRITICAL",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      row: "hover:bg-rose-500/5",
      dot: "bg-rose-500",
    };
  if (s === "WARNING" || s === "WARN")
    return {
      emoji: "🟡",
      label: "WARNING",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      row: "hover:bg-amber-500/5",
      dot: "bg-amber-400",
    };
  return {
    emoji: "🔵",
    label: "INFO",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    row: "hover:bg-card/90",
    dot: "bg-sky-400",
  };
}

/** Format actor: split human name and email cleanly */
function formatActor(actor: string): { main: string; sub?: string } {
  if (!actor) return { main: "System Ingress" };
  
  // Format: "Super Admin (superadmin@example.com)"
  const match = actor.match(/^([^(]+)\(([^)]+)\)$/);
  if (match) {
    return { main: match[1].trim(), sub: match[2].trim() };
  }
  if (actor.includes("@")) {
    const parts = actor.split("@");
    return { main: parts[0], sub: `@${parts[1]}` };
  }
  if (actor.startsWith("token-") || actor.startsWith("API Token")) {
    return { main: "API Token", sub: actor.replace(/^token-|^API Token\s*/, "") };
  }
  if (actor.startsWith("session-")) {
    return { main: "Web Session", sub: actor.replace("session-", "") };
  }
  return { main: actor };
}

/** Format technical action name to user-friendly label with icon */
function formatActionDisplay(action: string): { label: string; icon: React.ReactNode } {
  const a = (action ?? "").toUpperCase();
  if (a.includes("IMPERSONATION_STARTED")) {
    return { label: "Impersonasi Dimulai", icon: <UserCheck className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("IMPERSONATION_ENDED")) {
    return { label: "Impersonasi Diakhiri", icon: <ShieldCheck className="size-3 text-sky-500 shrink-0" /> };
  }
  if (a.includes("NUCLEAR") || a.includes("TENANT_NUCLEAR_DELETED")) {
    return { label: "Hapus Tenant Permanen (Nuke)", icon: <Trash2 className="size-3 text-rose-500 shrink-0" /> };
  }
  if (a.includes("TENANT_CREATED")) {
    return { label: "Pendaftaran Tenant Baru", icon: <Building className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("TENANT_RESTORED")) {
    return { label: "Pemulihan Tenant (Restore)", icon: <RotateCcw className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("TENANT_IMPORTED")) {
    return { label: "Impor Backup Tenant", icon: <Download className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("TOKEN_REVOKED") || a.includes("SCOPED_TOKEN_REVOKED")) {
    return { label: "Token Akses Dicabut", icon: <KeyRound className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("TOKEN_CREATED") || a.includes("SCOPED_TOKEN_CREATED")) {
    return { label: "Token Akses Dibuat", icon: <KeyRound className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("WEBHOOK") || a.includes("SECRET_ROLLED")) {
    return { label: "Webhook Secret Dirotasi", icon: <RefreshCw className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("API_KEY")) {
    return { label: "API Key Dibuat Ulang", icon: <RefreshCw className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("AI_SOP_GENERATE")) {
    return { label: "AI Generate SOP", icon: <Sparkles className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("AI_") || a.includes("CHAT")) {
    return { label: "AI Fiber Copilot Session", icon: <Bot className="size-3 text-indigo-500 shrink-0" /> };
  }
  if (a.includes("RATE_LIMIT")) {
    return { label: "Rate Limit Gateway", icon: <AlertTriangle className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("LOGIN_SUCCESS") || a === "LOGIN") {
    return { label: "User Login Sukses", icon: <ShieldCheck className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("LOGIN_FAILED") || a.includes("LOGIN_ERROR")) {
    return { label: "Gagal Autentikasi", icon: <ShieldAlert className="size-3 text-rose-500 shrink-0" /> };
  }
  if (a.includes("PASSWORD_RESET")) {
    return { label: "Reset Password Akun", icon: <Lock className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("GLOBAL_SETTINGS") || a.includes("SETTINGS")) {
    return { label: "Konfigurasi Sistem Diperbarui", icon: <Settings className="size-3 text-sky-500 shrink-0" /> };
  }
  if (a.includes("OBSIDIAN")) {
    return { label: "Sinkronisasi Obsidian Vault", icon: <FileCode className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("TASK")) {
    return { label: "Manajemen Task & Work Order", icon: <CheckSquare className="size-3 text-primary shrink-0" /> };
  }
  if (a.includes("CACHE") || a.includes("PURGE")) {
    return { label: "Purge Cache Gateway", icon: <Flame className="size-3 text-amber-500 shrink-0" /> };
  }
  if (a.includes("SERVICE")) {
    return { label: "Status Layanan Sistem", icon: <Activity className="size-3 text-sky-500 shrink-0" /> };
  }

  // Dynamic fallback for any other action name
  const cleanLabel = action
    .replace(/^(POST|PUT|DELETE|GET):/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return { label: cleanLabel, icon: <Activity className="size-3 text-muted-foreground shrink-0" /> };
}

export function SecurityAuditTab({ items, loading }: SecurityAuditTabProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-border bg-card/20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 p-8 text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            <ShieldCheck className="size-6" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Tidak Ada Event Berisiko Tinggi</h4>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
            Tidak ada aktivitas keamanan sensitif (impersonasi, privilege change, realm sync)
            yang terdeteksi dalam 24 jam terakhir.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2.5 text-[11px] gap-1 text-muted-foreground hover:text-primary">
          <Link href="/audit">
            <Info className="size-3" />
            <span>Lihat Semua Audit Logs</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/60">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Waktu (WIB)</th>
              <th className="py-2.5 px-3.5">Aktor / Akun</th>
              <th className="py-2.5 px-3.5">Target Tenant</th>
              <th className="py-2.5 px-3.5">Aksi Keamanan</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Tingkat Risiko</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Log Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((audit) => {
              const meta = getSeverityMeta(audit.severity);
              const actor = formatActor(audit.actor);
              const actionDisplay = formatActionDisplay(audit.action);

              return (
                <tr
                  key={audit.id}
                  className={cn("group transition-colors duration-150", meta.row)}
                >
                  {/* Waktu (WIB) */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full shrink-0", meta.dot)} />
                      <span className="font-mono text-[11px] text-muted-foreground font-medium">
                        {(audit.timestamp ?? "").replace(/ WIB$/, "")}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">WIB</span>
                    </div>
                  </td>

                  {/* Aktor / Akun */}
                  <td className="py-2.5 px-3.5">
                    <span className="font-semibold text-foreground block truncate max-w-[150px]">
                      {actor.main}
                    </span>
                    {actor.sub && (
                      <span className="text-[10px] font-mono text-muted-foreground/70 block truncate max-w-[150px]">
                        {actor.sub}
                      </span>
                    )}
                    {audit.ipAddress && (
                      <span className="text-[9px] font-mono text-muted-foreground/50 block">
                        IP: {audit.ipAddress}
                      </span>
                    )}
                  </td>

                  {/* Target Tenant */}
                  <td className="py-2.5 px-3.5">
                    <span className="text-foreground/90 font-medium text-[11px] truncate block max-w-[130px]">
                      {audit.targetTenant || "Platform Wide"}
                    </span>
                  </td>

                  {/* Aksi Keamanan */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-1.5">
                      {actionDisplay.icon}
                      <span
                        className="font-medium text-[11px] text-foreground truncate block max-w-[200px]"
                        title={audit.action}
                      >
                        {actionDisplay.label}
                      </span>
                    </div>
                    {audit.details && (
                      <span
                        className="text-[10px] text-muted-foreground/80 truncate block max-w-[220px] mt-0.5"
                        title={audit.details}
                      >
                        {audit.details}
                      </span>
                    )}
                  </td>

                  {/* Tingkat Risiko */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono font-bold",
                        meta.badge
                      )}
                    >
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </span>
                  </td>

                  {/* Log Details */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1"
                    >
                      <Link href="/audit">
                        <span>View Logs</span>
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
