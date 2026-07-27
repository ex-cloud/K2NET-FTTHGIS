import { redirect } from "next/navigation";

// Security & CORS settings moved to /security section (Gateways CORS)
export default function SettingsSecurityRedirectPage() {
  redirect("/security/auth");
}
