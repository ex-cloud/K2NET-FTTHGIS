"use client";

import { RolesMatrixUI } from "@/components/roles-matrix-ui";
import { PermissionGuard } from "@/hooks/use-permissions";
import { Shield } from "lucide-react";

export default function OrgRolesPage() {
  return (
    <PermissionGuard 
      permission="roles.view"
      fallback={
        <div className="flex-1 w-full bg-transparent overflow-auto custom-scrollbar flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You do not have permission to manage roles and permissions.</p>
          </div>
        </div>
      }
    >
      <div className="flex-1 w-full min-w-0 p-4 md:p-8 overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full pb-8">
          <RolesMatrixUI context="tenant" />
        </div>
      </div>
    </PermissionGuard>
  );
}
