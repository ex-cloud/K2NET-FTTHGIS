import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Legacy route `/settings/smtp-mail` redirects to the unified Notification Gateway
 * configuration center (`/gateways/notification`) to eliminate duplicate SMTP UI.
 */
export default function SettingsSmtpMailPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/gateways/notification", replace: true });
  }, [navigate]);

  return null;
}
