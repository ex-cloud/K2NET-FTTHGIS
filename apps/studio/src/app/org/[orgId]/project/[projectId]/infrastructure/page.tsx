"use client";

import { redirect } from "next/navigation";
import { use } from "react";

export default function InfrastructurePage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  const { orgId, projectId } = use(params);
  redirect(`/org/${orgId}/project/${projectId}/infrastructure/topology`);
}
