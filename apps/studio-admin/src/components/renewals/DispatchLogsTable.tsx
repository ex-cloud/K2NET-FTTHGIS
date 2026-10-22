import * as React from "react";
import { Card, Button, Badge } from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import {
  Bell,
  RefreshCcw,
  Mail,
  MessageSquare,
  Eye,
  RotateCw,
} from "lucide-react";
import type { RenewalDispatchLog } from "@/hooks/useBillingRenewals";

export interface DispatchLogsTableProps {
  logs: RenewalDispatchLog[];
  isLoading: boolean;
  onViewPayload: (log: RenewalDispatchLog) => void;
  onRetry: (log: RenewalDispatchLog) => void;
}

export function DispatchLogsTable({
  logs,
  isLoading,
  onViewPayload,
  onRetry,
}: DispatchLogsTableProps) {
  const { t } = useTranslation();

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
              <th className="py-2.5 px-3 font-medium">{t("billing.invoice_date")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_tenant")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_channel")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_dunning_stage")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_recipient")}</th>
              <th className="py-2.5 px-3 font-medium">{t("billing.th_status")}</th>
              <th className="py-2.5 px-3 font-medium text-right">{t("billing.th_actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  <RefreshCcw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                  <span>{t("common.loading")}</span>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  <Bell className="size-6 mx-auto mb-2 opacity-40" />
                  <p>{t("billing.empty_logs")}</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isFailed = log.status?.toUpperCase() === "FAILED";
                const isSent = log.status?.toUpperCase() === "SENT";

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-3 font-mono text-muted-foreground whitespace-nowrap">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
                    </td>

                    {/* Tenant */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {log.organizationName || "Unknown"}
                        </span>
                        {log.organizationSlug && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {log.organizationSlug}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                        {log.channel?.toUpperCase() === "EMAIL" ? (
                          <Mail className="size-3.5 text-blue-500" />
                        ) : (
                          <MessageSquare className="size-3.5 text-primary" />
                        )}
                        <span>{log.channel}</span>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                      {log.stage}
                    </td>

                    {/* Recipient */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-foreground truncate max-w-[180px]">
                      {log.recipient}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${
                          isSent
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : isFailed
                            ? "border-destructive/40 bg-destructive/10 text-destructive animate-pulse"
                            : "border-border bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isSent ? "bg-primary" : isFailed ? "bg-destructive" : "bg-muted-foreground"
                          }`}
                        />
                        <span>{log.status}</span>
                      </Badge>
                      {log.errorDetails && (
                        <p className="text-[10px] text-destructive truncate max-w-[160px] mt-0.5 font-mono">
                          {log.errorDetails}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {log.messageContent && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onViewPayload(log)}
                            className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1"
                            title={t("billing.view_message_detail")}
                          >
                            <Eye className="size-3" />
                            <span>{t("billing.view_message_detail")}</span>
                          </Button>
                        )}

                        {isFailed && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => onRetry(log)}
                            className="h-6 px-2 text-[11px] font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
                          >
                            <RotateCw className="size-3" />
                            <span>{t("billing.action_retry_dispatch")}</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
