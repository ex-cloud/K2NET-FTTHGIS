"use client";

import { useState, useEffect, useCallback } from "react";

export function useImpersonation() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [orgName, setOrgName] = useState("System Partner");

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const impCookie = cookies.find((row) => row.startsWith("k2net_impersonation="));
    const orgCookie = cookies.find((row) => row.startsWith("k2net_impersonation_org="));

    if (impCookie && impCookie.split("=")[1] === "true") {
      setIsImpersonating(true);
    }
    if (orgCookie && orgCookie.split("=")[1]) {
      setOrgName(decodeURIComponent(orgCookie.split("=")[1]));
    }
  }, []);

  const exitImpersonation = useCallback(() => {
    // Clear cookies across root domain
    document.cookie = "k2net_impersonation=; max-age=0; path=/; domain=.k2net.id";
    document.cookie = "k2net_impersonation=; max-age=0; path=/";
    document.cookie = "k2net_impersonation_org=; max-age=0; path=/; domain=.k2net.id";
    document.cookie = "k2net_impersonation_org=; max-age=0; path=/";
    
    // Redirect back to studio-admin overview
    window.location.assign("https://system-gis.k2net.id/overview");
  }, []);

  return {
    isImpersonating,
    orgName,
    exitImpersonation,
  };
}
