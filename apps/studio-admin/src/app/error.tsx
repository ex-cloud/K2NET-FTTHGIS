"use client";

import { useSession } from "next-auth/react";
import { ServerError } from "@k2net/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const { data: session } = useSession();

  return (
    <ServerError
      error={error}
      reset={reset}
      accessToken={session?.accessToken}
    />
  );
}
