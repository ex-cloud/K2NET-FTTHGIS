import { useEffect } from "react";
import { toast } from "sonner";
import type { ViewMode } from "./useOrganizationsDirectory";

interface UseOrganizationsHotkeysParams {
  refetch: () => void;
  setCompactView: React.Dispatch<React.SetStateAction<boolean>>;
  setWizardOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedIds: (ids: string[]) => void;
}

export function useOrganizationsHotkeys({
  refetch,
  setCompactView,
  setWizardOpen,
  setViewMode,
  setSelectedIds,
}: UseOrganizationsHotkeysParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        setCompactView((prev) => !prev);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        refetch();
        toast.success("Organization directory refreshed");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setWizardOpen(true);
      } else if (e.key === "1") {
        setViewMode("grid");
      } else if (e.key === "2") {
        setViewMode("list");
      } else if (e.key === "3") {
        setViewMode("table");
      } else if (e.key === "Escape") {
        setSelectedIds([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [refetch, setCompactView, setWizardOpen, setViewMode, setSelectedIds]);
}
