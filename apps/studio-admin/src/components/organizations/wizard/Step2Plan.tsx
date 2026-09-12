import * as React from "react";
import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@k2net/ui";
import { cn } from "@/lib/utils";
import { PLAN_SPECS, type PlanType, type WizardFormData } from "./types";

interface Step2PlanProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
}

export function Step2Plan({ formData, setFormData }: Step2PlanProps) {
  const selectedPlan = PLAN_SPECS[formData.plan];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["FREE", "PRO", "ENTERPRISE"] as PlanType[]).map((tierKey) => {
          const item = PLAN_SPECS[tierKey];
          const isSelected = formData.plan === tierKey;

          return (
            <div
              key={tierKey}
              onClick={() => setFormData((prev) => ({ ...prev, plan: tierKey }))}
              className={cn(
                "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative space-y-3",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card/60 hover:bg-card hover:border-border/80"
              )}
            >
              {tierKey === "PRO" && (
                <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Recommended
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{item.name}</span>
                  <span
                    className={cn(
                      "size-4 rounded-full border flex items-center justify-center",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {isSelected && <Check className="size-2.5" />}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-primary">{item.price}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/50 text-[11px] text-muted-foreground font-mono">
                <div className="flex justify-between">
                  <span>Max OLT:</span>
                  <strong className="text-foreground">{item.olts} Nodes</strong>
                </div>
                <div className="flex justify-between">
                  <span>Max ODP:</span>
                  <strong className="text-foreground">{item.odps.toLocaleString()} Encl.</strong>
                </div>
                <div className="flex justify-between">
                  <span>S3 Storage:</span>
                  <strong className="text-foreground">{item.storageGb} GB</strong>
                </div>
                <div className="flex justify-between">
                  <span>SLA Target:</span>
                  <strong className="text-foreground">{item.sla}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Plan Details Strip */}
      <div className="rounded-xl border border-border/80 bg-card/80 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span>Included in {selectedPlan.name} Plan:</span>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-mono text-[10px]">
            {selectedPlan.sla}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
          {selectedPlan.features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-primary shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
