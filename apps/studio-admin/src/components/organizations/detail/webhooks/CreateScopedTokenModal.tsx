import { useState } from "react";
import {
  Button,
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
import { KeyRound, CheckCircle2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@k2net/i18n";

interface CreateScopedTokenModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; scopes: string[]; expiresInDays: number | null }) => Promise<void>;
}

export function CreateScopedTokenModal({
  isOpen,
  onOpenChange,
  onCreate,
}: CreateScopedTokenModalProps) {
  const { t } = useTranslation();
  const [tokenName, setTokenName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "coverage:read",
    "network:read",
  ]);
  const [expiryDays, setExpiryDays] = useState<number | null>(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableScopes = [
    {
      category: "Coverage Maps & ODPs",
      scopes: [
        { id: "coverage:read", label: "coverage:read", desc: "View coverage boundary, ODP, and pole data" },
        { id: "coverage:write", label: "coverage:write", desc: t("organizations.scope_coverage_write_desc") },
      ],
    },
    {
      category: "Network Infrastructure",
      scopes: [
        { id: "network:read", label: "network:read", desc: "Read status of OLT, ONU, feeder cables, and splitters" },
        { id: "network:write", label: "network:write", desc: "ONU provisioning, fiber core management, and splicing" },
      ],
    },
    {
      category: "Customers & Subscribers",
      scopes: [
        { id: "customers:read", label: "customers:read", desc: "Read subscriber data, internet packages, and drop core locations" },
        { id: "customers:write", label: "customers:write", desc: "Register and modify subscriber data" },
      ],
    },
    {
      category: "Billing & Invoicing",
      scopes: [
        { id: "billing:read", label: "billing:read", desc: "Read invoice history and payment transactions" },
        { id: "billing:write", label: "billing:write", desc: "Generate invoices and verify payment statuses" },
      ],
    },
    {
      category: "Webhooks & Automation",
      scopes: [
        { id: "webhooks:manage", label: "webhooks:manage", desc: "Manage webhook endpoints and event subscriptions" },
      ],
    },
  ];

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const selectAllScopes = () => {
    const all = availableScopes.flatMap((c) => c.scopes.map((s) => s.id));
    setSelectedScopes(all);
  };

  const clearAllScopes = () => {
    setSelectedScopes([]);
  };

  const handleCreate = async () => {
    if (!tokenName.trim() || selectedScopes.length === 0) return;
    try {
      setIsSubmitting(true);
      await onCreate({
        name: tokenName.trim(),
        scopes: selectedScopes,
        expiresInDays: expiryDays,
      });
      onOpenChange(false);
      setTokenName("");
      setSelectedScopes(["coverage:read", "network:read"]);
      setExpiryDays(90);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-card border-border shadow-lg p-6 space-y-4 max-h-[88vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Generate Granular Scoped API Token
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Specify granular access permissions (scopes) for this integration token.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Token Name / Description</Label>
            <Input
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. Billing MikroTik Sync, Grafana Prometheus Exporter"
              className="h-9 text-xs bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Token Expiration Period</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: "30 Days", val: 30 },
                { label: "60 Days", val: 60 },
                { label: "90 Days", val: 90 },
                { label: "180 Days", val: 180 },
                { label: "1 Year", val: 365 },
                { label: "No Expiry", val: null },
              ].map((item) => (
                <button
                  key={String(item.val)}
                  type="button"
                  onClick={() => setExpiryDays(item.val)}
                  className={cn(
                    "p-2 rounded-lg border text-center text-xs transition-colors cursor-pointer",
                    expiryDays === item.val
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>API Access Permissions (Granular Scopes)</span>
              </Label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllScopes}
                  className="text-primary hover:underline cursor-pointer"
                >
                  {t("organizations.select_all")}
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={clearAllScopes}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {t("common.reset")}
                </button>
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-background/50 border border-border">
              {availableScopes.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-foreground/80 tracking-wide uppercase">
                    {cat.category}
                  </div>
                  <div className="grid grid-cols-1 gap-2 pl-1">
                    {cat.scopes.map((s) => {
                      const checked = selectedScopes.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleScope(s.id)}
                          className={cn(
                            "flex items-start gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors",
                            checked
                              ? "bg-primary/5 border-primary/40 text-foreground"
                              : "bg-card border-border/60 text-muted-foreground hover:bg-muted/40"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleScope(s.id)}
                            className="mt-0.5"
                          />
                          <div className="space-y-0.5">
                            <div className="font-mono font-semibold text-foreground text-xs">{s.label}</div>
                            <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 sm:justify-between items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {selectedScopes.length} scopes selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs border-border cursor-pointer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!tokenName.trim() || selectedScopes.length === 0 || isSubmitting}
              className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Generating..." : "Generate Token"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
