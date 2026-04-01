import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProjectOverview } from "@/components/dashboard/project-overview";

export default async function ProjectPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 w-full bg-transparent overflow-auto">
      <ProjectOverview />
    </div>
  );
}
