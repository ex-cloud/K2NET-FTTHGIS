"use client";

import { ReactNode } from "react";
import { PermissionGuard } from "@/hooks/use-permissions";
import { Shield } from "lucide-react";

interface InventoryPageWrapperProps {
  children: ReactNode;
}

export function InventoryPageWrapper({ children }: InventoryPageWrapperProps) {
  return (
    <PermissionGuard
      permission="inventory.view"
      fallback={
        <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Anda tidak memiliki izin untuk melihat inventaris proyek.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </PermissionGuard>
  );
}
