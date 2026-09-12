"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@k2net/ui";
import { ShieldAlert, ExternalLink, Loader2, ArrowRightLeft } from "lucide-react";
import type { EnrichedOrganization } from "./types";
import { useImpersonateTenantState } from "./impersonation/useImpersonateTenantState";
import { ImpersonateFormBody } from "./impersonation/ImpersonateFormBody";

interface ImpersonateTenantModalProps {
  organization: EnrichedOrganization | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ImpersonateTenantModal({
  organization,
  isOpen,
  onClose,
}: ImpersonateTenantModalProps) {
  const state = useImpersonateTenantState(organization, isOpen, onClose);

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !state.submitting && onClose()}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              Support Mode — God Mode Impersonation
            </span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Mulai Sesi Impersonasi Tenant
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Akses portal tenant atas nama dukungan operasional dengan pengawasan ketat dual-identity audit.
          </DialogDescription>
        </DialogHeader>

        <ImpersonateFormBody
          organization={organization}
          hasDifferentActiveSession={state.hasDifferentActiveSession}
          activeTargetOrgName={state.activeSession?.targetOrgName}
          conflictError={state.conflictError}
          reason={state.reason}
          setReason={state.setReason}
          ticketReference={state.ticketReference}
          setTicketReference={state.setTicketReference}
          submitting={state.submitting}
          isReasonValid={state.isReasonValid}
          onRetryWithAutoSwitch={() => state.triggerStart(state.reason, state.ticketReference, true)}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={state.submitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            onClick={() => state.triggerStart(state.reason, state.ticketReference, state.hasDifferentActiveSession)}
            disabled={!state.isReasonValid || state.submitting}
            className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-primary-foreground font-semibold"
          >
            {state.submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Memproses Sesi...</span>
              </>
            ) : state.hasDifferentActiveSession ? (
              <>
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Beralih ke {organization.name}</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Mulai Impersonasi</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
