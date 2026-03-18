export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string; projectId: string }>;
}) {
  // Just ensuring params are consumed if needed
  await params;

  return <>{children}</>;
}
