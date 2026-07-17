import { RolesMatrixUI } from "@/components/roles-matrix-ui";
import { Metadata } from "next";
import { SystemSecurityWrapper } from "@/components/page-guards/system-security-wrapper";

export const metadata: Metadata = {
  title: "System Role Templates | FTTH GIS",
  description: "Manage global system role templates and permissions.",
};

export default function SystemRolesPage() {
  return (
    <SystemSecurityWrapper>
      <div className="flex-1 w-full min-w-0 p-4 md:p-8 overflow-hidden">
        <div className="max-w-[1600px] mx-auto w-full pb-8">
          <RolesMatrixUI context="system" />
        </div>
      </div>
    </SystemSecurityWrapper>
  );
}
