import { RolesMatrixUI } from "@/components/roles-matrix-ui";
import { Metadata } from "next";
import { SystemSecurityWrapper } from "@/components/page-guards/system-security-wrapper";
import { PageLayout } from "@k2net/ui";

export const metadata: Metadata = {
  title: "System Role Templates | FTTH GIS",
  description: "Manage global system role templates and permissions.",
};

export default function SystemRolesPage() {
  return (
    <SystemSecurityWrapper>
      <PageLayout variant="workspace">
        <RolesMatrixUI context="system" />
      </PageLayout>
    </SystemSecurityWrapper>
  );
}
