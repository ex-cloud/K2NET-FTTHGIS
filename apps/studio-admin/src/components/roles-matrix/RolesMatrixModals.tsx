import { AlertTriangle, ShieldAlert, Trash2, UserCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@k2net/ui";
import { useTranslation } from "@k2net/i18n";
import type { Role, ImpactData } from "./types";

interface RolesMatrixModalsProps {
  showConfirmDialog: boolean;
  setShowConfirmDialog: (open: boolean) => void;
  pendingRoleToSave: Role | null;
  onConfirmStandardTemplate: (role: Role) => void;
  impactModalOpen: boolean;
  setImpactModalOpen: (open: boolean) => void;
  impactData: ImpactData | null;
  onConfirmImpact: (data: ImpactData) => void;
  roleToDelete?: Role | null;
  setRoleToDelete?: (role: Role | null) => void;
  onConfirmDeleteRole?: (role: Role) => void;
  isDeletingRole?: boolean;
}

export function RolesMatrixModals({
  showConfirmDialog,
  setShowConfirmDialog,
  pendingRoleToSave,
  onConfirmStandardTemplate,
  impactModalOpen,
  setImpactModalOpen,
  impactData,
  onConfirmImpact,
  roleToDelete,
  setRoleToDelete,
  onConfirmDeleteRole,
  isDeletingRole = false,
}: RolesMatrixModalsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Confirmation Dialog for Standard Template */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {t("security.standard_template_title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {t("security.standard_template_desc", {
                role: pendingRoleToSave?.displayName || pendingRoleToSave?.name || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmDialog(false)}
              className="border-border/80 text-muted-foreground hover:text-foreground"
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (pendingRoleToSave) {
                  setShowConfirmDialog(false);
                  onConfirmStandardTemplate(pendingRoleToSave);
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMPACT PREVIEW CONFIRMATION MODAL */}
      <Dialog open={impactModalOpen} onOpenChange={setImpactModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {t("security.impact_confirm_title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
              {t("security.impact_confirm_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 max-h-[250px] overflow-y-auto custom-scrollbar">
            {impactData?.roles.map((r) => {
              const count = impactData.userCounts[r.id];
              const revoked = impactData.revocations[r.id] || [];
              if (!count || count.activeUserCount === 0 || revoked.length === 0) return null;

              return (
                <div key={r.id} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-sm">{r.displayName || r.name}</span>
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                      <UserCheck className="size-3.5" />
                      {t("security.active_users_count", { count: count.activeUserCount })}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground block mb-1">
                      {t("security.revoked_permissions_count", { count: revoked.length })}
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px] text-amber-300">
                      {revoked.map((p) => (
                        <li key={p.id}>{p.code}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImpactModalOpen(false)}
              className="border-border/80 text-muted-foreground hover:text-foreground"
            >
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setImpactModalOpen(false);
                if (impactData) {
                  onConfirmImpact(impactData);
                }
              }}
              className="bg-amber-600 hover:bg-amber-500 text-primary-foreground"
            >
              {t("security.impact_confirm_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CUSTOM ROLE CONFIRMATION MODAL */}
      <Dialog
        open={Boolean(roleToDelete)}
        onOpenChange={(open) => {
          if (!open && setRoleToDelete) setRoleToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                {t("security.delete_role_confirm_title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
              {t("security.delete_role_confirm_desc", {
                name: roleToDelete?.displayName || roleToDelete?.name || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeletingRole}
              onClick={() => setRoleToDelete?.(null)}
              className="border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeletingRole}
              onClick={() => {
                if (roleToDelete && onConfirmDeleteRole) {
                  onConfirmDeleteRole(roleToDelete);
                }
              }}
              className="gap-1.5 cursor-pointer"
            >
              {isDeletingRole ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              <span>{t("security.delete_role")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
