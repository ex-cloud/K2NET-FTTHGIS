import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 w-full bg-transparent overflow-auto">
      <ExecutiveDashboard />
    </div>
  );
}
