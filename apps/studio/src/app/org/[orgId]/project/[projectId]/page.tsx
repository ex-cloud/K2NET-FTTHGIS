import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { ProjectPageWrapper } from "@/components/page-guards/project-page-wrapper";

export default async function ProjectPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <ProjectPageWrapper>
      <div className="flex-1 w-full bg-transparent overflow-auto">
        <ProjectOverview />
      </div>
    </ProjectPageWrapper>
  );
}
