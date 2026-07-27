import { redirect } from "next/navigation";

// Audit Log Retention settings moved to /security/audit
export default function SettingsAuditLogsRedirectPage() {
  redirect("/security/audit");
}
