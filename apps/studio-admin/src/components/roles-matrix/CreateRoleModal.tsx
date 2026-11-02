import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Textarea,
} from "@k2net/ui";
import { ShieldPlus, Server, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRole } from "./rolesMatrixApi";
import { cn } from "@/lib/utils";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope: "SYSTEM" | "TENANT";
  token?: string;
  onSuccess: () => void;
}

export function CreateRoleModal({
  open,
  onOpenChange,
  defaultScope,
  token,
  onSuccess,
}: CreateRoleModalProps) {
  const [scope, setScope] = useState<"SYSTEM" | "TENANT">(defaultScope);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;

    setIsSubmitting(true);
    try {
      await createRole(
        {
          name: name.trim().toLowerCase().replaceAll(/[^a-z0-9_]/g, "_"),
          displayName: displayName.trim() || name.trim().toUpperCase(),
          description: description.trim() || undefined,
          scope,
          permissionIds: [],
        },
        token
      );

      toast.success(`Role "${displayName || name}" created successfully!`);
      onOpenChange(false);
      setName("");
      setDisplayName("");
      setDescription("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-xl border-border sm:max-w-[460px] p-0 overflow-hidden shadow-xl text-foreground">
        <DialogHeader className="p-6 pb-2 text-foreground">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ShieldPlus className="w-4 h-4 text-primary" />
            <span>Create Custom PBAC Role</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new professional role to the authorization matrix and customize its permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Scope Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Security Scope</Label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted/40 border border-border">
              <button
                type="button"
                onClick={() => setScope("TENANT")}
                className={cn(
                  "py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  scope === "TENANT"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="size-3.5" />
                <span>Tenant Template</span>
              </button>
              <button
                type="button"
                onClick={() => setScope("SYSTEM")}
                className={cn(
                  "py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  scope === "SYSTEM"
                    ? "bg-primary/15 text-primary border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Server className="size-3.5" />
                <span>System Plane</span>
              </button>
            </div>
          </div>

          {/* 2. Identifier Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Role Key / Identifier <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. field_supervisor, cabling_tech"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!displayName) {
                  setDisplayName(e.target.value.replace(/_/g, " ").toUpperCase());
                }
              }}
              className="bg-card border-border text-foreground h-9 text-xs font-mono"
              required
            />
          </div>

          {/* 3. Display Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Display Name</Label>
            <Input
              placeholder="e.g. Field Supervisor"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-card border-border text-foreground h-9 text-xs"
            />
          </div>

          {/* 4. Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Description / Responsibility</Label>
            <Textarea
              placeholder="Describe the operational role and expected responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-card border-border text-foreground text-xs min-h-[70px]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isSubmitting}
              className="text-xs font-medium bg-primary text-primary-foreground cursor-pointer gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

