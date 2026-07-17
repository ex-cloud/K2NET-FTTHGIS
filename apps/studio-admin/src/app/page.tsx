import { redirect } from "next/navigation";

/**
 * Root page for studio-admin.
 * Redirects authenticated users to /organizations (the admin home).
 * Unauthenticated users are caught by proxy.ts middleware → /login.
 */
export default function RootPage() {
  redirect("/organizations");
}
