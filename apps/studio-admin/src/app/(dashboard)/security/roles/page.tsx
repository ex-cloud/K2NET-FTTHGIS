import { RolesMatrixUI } from "@/components/roles-matrix-ui";
import { SystemSecurityWrapper } from "@/components/page-guards/system-security-wrapper";
import { PageLayout } from "@k2net/ui";


export default function SystemRolesPage() {
  return (
    <SystemSecurityWrapper>
      <PageLayout variant="workspace">
        <RolesMatrixUI context="system" />
      </PageLayout>
    </SystemSecurityWrapper>
  );
}
