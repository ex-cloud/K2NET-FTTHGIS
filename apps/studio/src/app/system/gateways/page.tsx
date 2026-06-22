import { redirect } from "next/navigation";

export default function GatewaysIndexPage() {
  // Redirect to the gateways overview dashboard page
  redirect("/gateways/overview");
}
