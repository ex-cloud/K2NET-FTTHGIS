"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/account/preferences");
  }, [router]);

  return null;
}
