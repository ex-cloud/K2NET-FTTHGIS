import { Code2, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@k2net/ui";
import type { PermissionUsageResponse } from "./permissions-types";

interface TraceabilityModalProps {
  code: string | null;
  data: PermissionUsageResponse | null;
  loading: boolean;
  onClose: () => void;
}

export function TraceabilityModal({ code, data, loading, onClose }: TraceabilityModalProps) {
  if (!code) return null;

  return (
    <Dialog open={!!code} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-sky-500/10 text-sky-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Traceability Endpoint
                <code className="text-xs font-mono text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded border border-sky-500/30">
                  {code}
                </code>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Daftar endpoint controller backend yang diproteksi oleh kode hak akses ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-2 max-h-[350px] overflow-y-auto custom-scrollbar space-y-3">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              Memindai metadata otorisasi endpoint...
            </div>
          ) : !data || data.usages.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 space-y-1 text-center">
              <span className="text-sm font-semibold text-amber-400 block">⚪ Belum Digunakan (Dead Entry)</span>
              <p className="text-xs text-muted-foreground">
                Permission ini belum diterapkan pada anotasi <code>@PreAuthorize</code> di controller backend manapun.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">HTTP &amp; Path</th>
                    <th className="p-2.5">Controller &amp; Method</th>
                    <th className="p-2.5">Otorisasi (SpEL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.usages.map((u, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-2.5">
                        <span className="font-bold text-sky-400 font-mono text-[10px] mr-1.5 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                          {u.httpMethod}
                        </span>
                        <span className="font-mono text-foreground">{u.path}</span>
                      </td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        <span className="text-foreground font-medium">{u.controller}</span>.{u.method}()
                      </td>
                      <td className="p-2.5 font-mono text-[10px] text-muted-foreground break-all">
                        {u.authorizationExpression}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="border-border">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
