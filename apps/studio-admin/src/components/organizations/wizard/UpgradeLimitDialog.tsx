import * as React from "react";
import { Zap } from "lucide-react";
import { Button, Dialog, DialogContent } from "@k2net/ui";

interface UpgradeLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeLimitDialog({ open, onOpenChange }: UpgradeLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-popover text-foreground border-border p-6 rounded-2xl">
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="size-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-1">
            <Zap className="size-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Upgrade to Create More</h3>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
            Your active account is on the <strong className="text-amber-500 font-medium">FREE</strong> plan, which is
            limited to 1 organization. Please upgrade your subscription tier to unlock unlimited tenant creation.
          </p>
          <div className="flex items-center gap-3 w-full pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border text-muted-foreground hover:text-foreground h-9 text-xs"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                window.location.assign("/org");
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold h-9 text-xs"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
