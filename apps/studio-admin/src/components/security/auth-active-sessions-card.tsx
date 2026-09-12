import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Fingerprint,
  History,
  Globe,
  Trash2,
  AlertTriangle,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Copy,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ActionTooltip,
  UniversalContextMenu,
  type ContextMenuGroupConfig,
} from "@k2net/ui";
import { PermissionGuard } from "@/hooks/use-permissions";
import type { ActiveSession } from "@/hooks/useSecuritySettings";

function SessionsPagination({
  currentPage,
  totalPages,
  indexOfFirstItem,
  indexOfLastItem,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <span className="text-xs text-muted-foreground">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} sessions
      </span>
      <div className="flex items-center gap-2">
        <ActionTooltip label="Halaman Sebelumnya" shortcut="Alt+Left">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 bg-muted border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </ActionTooltip>
        <span className="text-xs text-muted-foreground px-2 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <ActionTooltip label="Halaman Berikutnya" shortcut="Alt+Right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 bg-muted border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </ActionTooltip>
      </div>
    </div>
  );
}

function SessionTableRow({
  session,
  onRevoke,
  isRevoking,
  contextGroups,
}: {
  session: ActiveSession;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
  contextGroups: ContextMenuGroupConfig[];
}) {
  return (
    <UniversalContextMenu groups={contextGroups}>
      <tr className="border-b border-border/40 hover:bg-muted/10 text-muted-foreground cursor-context-menu">
        <td className="p-4 font-medium flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-muted-foreground" /> {session.username}
        </td>
        <td className="p-4">
          <span className="text-[10px] bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground font-medium font-sans">
            {session.tenant || "System/Root"}
          </span>
        </td>
        <td className="p-4 font-mono text-muted-foreground">{session.ipAddress}</td>
        <td className="p-4">
          {new Date(session.start).toLocaleString("id-ID", { hour12: false })}
        </td>
        <td className="p-4">
          {new Date(session.lastAccess).toLocaleString("id-ID", { hour12: false })}
        </td>
        <td className="p-4">
          <div className="flex flex-wrap gap-1">
            {session.clients.map((client) => (
              <span key={client} className="text-[9px] bg-muted border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                {client}
              </span>
            ))}
          </div>
        </td>
        <td className="p-4 text-right">
          <PermissionGuard permission="system.security.manage">
            <ActionTooltip label="Putus Sesi Pengguna" shortcut="Del">
              <Button
                variant="destructive"
                onClick={() => onRevoke(session.id)}
                disabled={isRevoking}
                className="bg-rose-500/10 hover:bg-rose-500 hover:text-foreground border border-rose-500/20 text-rose-400 text-[10px] h-7 px-2.5 rounded-lg transition-all"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Revoke
              </Button>
            </ActionTooltip>
          </PermissionGuard>
        </td>
      </tr>
    </UniversalContextMenu>
  );
}

export function AuthActiveSessionsCard({
  sessions,
  revokeSession,
  isRevokingSession,
}: {
  sessions: ActiveSession[];
  revokeSession: (sessionId: string) => Promise<void>;
  isRevokingSession: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [sessions.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = sessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sessions.length / itemsPerPage);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      toast.success("User session terminated successfully.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke session");
    }
  };

  const getSessionContextMenuGroups = (sessionItem: ActiveSession): ContextMenuGroupConfig[] => [
    {
      items: [
        {
          label: "Tanya AI Analisis Sesi Ini",
          icon: Sparkles,
          shortcut: "Ctrl+J",
          onClick: () => {
            window.dispatchEvent(
              new CustomEvent("k2net-ai-prompt-input", {
                detail: {
                  prompt: `Analisis aktivitas dan keabsahan sesi pengguna: "${sessionItem.username}" (IP: ${sessionItem.ipAddress}, Tenant: ${sessionItem.tenant || "System"}). Login: ${sessionItem.start}, Last access: ${sessionItem.lastAccess}. Identifikasi potensi ancaman keamanan atau anomali IP.`,
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
          label: "Salin Username",
          icon: Copy,
          shortcut: "Ctrl+C",
          onClick: () => {
            navigator.clipboard.writeText(sessionItem.username || "");
            toast.success(`Username ${sessionItem.username} disalin!`);
          },
        },
        {
          label: "Salin IP Address",
          icon: Globe,
          shortcut: "Alt+C",
          onClick: () => {
            navigator.clipboard.writeText(sessionItem.ipAddress || "");
            toast.success(`IP ${sessionItem.ipAddress} disalin!`);
          },
        },
        {
          label: "Salin Session ID",
          icon: Fingerprint,
          shortcut: "Alt+I",
          onClick: () => {
            navigator.clipboard.writeText(sessionItem.id || "");
            toast.success("Session ID disalin!");
          },
        },
      ],
    },
    {
      items: [
        {
          label: "Putus Sesi Pengguna",
          icon: Trash2,
          shortcut: "Del",
          onClick: () => handleRevokeSession(sessionItem.id),
        },
      ],
    },
  ];

  return (
    <Card glowingEffect className="bg-card/40 border-border shadow-xl backdrop-blur-sm">
      <CardHeader className="border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Active SSO Sessions
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Real-time active single sign-on sessions on your tenant database and OAuth gateways.
          </CardDescription>
        </div>
        <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
          {sessions.length} Active Sessions
        </span>
      </CardHeader>
      <CardContent className="pt-6">
        {sessions.length === 0 ? (
          <div className="p-8 text-center border border-border/60 rounded-xl bg-background/40 text-muted-foreground text-xs">
            No active SSO sessions found on this server.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-border rounded-xl bg-background/30">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/40 text-muted-foreground font-medium">
                    <th className="p-4">User</th>
                    <th className="p-4">Tenant / Organization</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Login Time</th>
                    <th className="p-4">Last Access</th>
                    <th className="p-4">Client Access</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSessions.map((session) => (
                    <SessionTableRow
                      key={session.id}
                      session={session}
                      onRevoke={handleRevokeSession}
                      isRevoking={isRevokingSession}
                      contextGroups={getSessionContextMenuGroups(session)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {sessions.length > itemsPerPage && (
              <SessionsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
                totalItems={sessions.length}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}

        <div className="mt-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-semibold text-rose-400">Security Precaution</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Revoking an active session will immediately invalidate the user&apos;s OIDC access tokens. They will be forced to log out and authenticate again upon their next client request. Use this tool only to neutralize compromised sessions or during security incidents.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
