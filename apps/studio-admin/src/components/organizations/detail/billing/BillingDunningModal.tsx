


import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
} from "@k2net/ui";
import { ShieldAlert, Check, Loader2 } from "lucide-react";
import { useTranslation } from "@k2net/i18n";

interface BillingDunningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDunningLevel: number;
  setSelectedDunningLevel: (level: number) => void;
  dunningNotes: string;
  setDunningNotes: (notes: string) => void;
  isExecuting: boolean;
  onExecuteDunning: () => void;
}

export function BillingDunningModal({
  isOpen,
  onOpenChange,
  selectedDunningLevel,
  setSelectedDunningLevel,
  dunningNotes,
  setDunningNotes,
  isExecuting,
  onExecuteDunning,
}: BillingDunningModalProps) {
  const { t } = useTranslation();

  const dunningLevels = [
    { level: 0, title: t("organizations.dunning_level_0_title"), desc: t("organizations.dunning_level_0_desc") },
    { level: 1, title: t("organizations.dunning_level_1_title"), desc: t("organizations.dunning_level_1_desc") },
    { level: 2, title: t("organizations.dunning_level_2_title"), desc: t("organizations.dunning_level_2_desc") },
    { level: 3, title: t("organizations.dunning_level_3_title"), desc: t("organizations.dunning_level_3_desc") },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[480px] p-0 overflow-hidden shadow-lg text-foreground rounded-2xl">
        <DialogHeader className="p-5 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>{t("organizations.dunning_title")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("organizations.dunning_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("organizations.dunning_level_label")}</Label>
            <div className="space-y-2">
              {dunningLevels.map((item) => (
                <div
                  key={item.level}
                  onClick={() => setSelectedDunningLevel(item.level)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedDunningLevel === item.level
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card/60 hover:bg-card text-foreground/80"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{item.title}</span>
                    {selectedDunningLevel === item.level && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("organizations.dunning_notes_label")}</Label>
            <Input
              placeholder={t("organizations.dunning_notes_placeholder")}
              value={dunningNotes}
              onChange={(e) => setDunningNotes(e.target.value)}
              className="h-8 text-xs bg-card border-border text-foreground"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs cursor-pointer">
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={onExecuteDunning}
            disabled={isExecuting}
            className="text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 cursor-pointer"
          >
            {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("organizations.dunning_save_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
