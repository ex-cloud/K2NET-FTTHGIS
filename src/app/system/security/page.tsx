import { redirect } from "next/navigation";

export default function SecurityIndexPage() {
  // Automatically redirect to the first sub-menu item (roles)
  redirect("/system/security/roles");
}
