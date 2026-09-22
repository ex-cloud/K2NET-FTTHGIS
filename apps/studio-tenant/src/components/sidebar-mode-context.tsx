import * as React from "react";

export type SidebarMode = "expanded" | "collapsed" | "hover";

interface SidebarModeContextProps {
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarModeContext = React.createContext<SidebarModeContextProps | null>(null);

export function SidebarModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarMode, setSidebarModeState] = React.useState<SidebarMode>("expanded");
  const [open, setOpen] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize from localStorage immediately on mount
  React.useLayoutEffect(() => {
    const savedMode = localStorage.getItem("tenant-sidebar-mode") as SidebarMode;
    const mode =
      savedMode && ["expanded", "collapsed", "hover"].includes(savedMode)
        ? savedMode
        : "expanded";

    setSidebarModeState(mode);
    if (mode === "collapsed" || mode === "hover") {
      setOpen(false);
    } else {
      setOpen(true);
    }
    setIsInitialized(true);
  }, []);

  const setSidebarMode = React.useCallback((mode: SidebarMode) => {
    setSidebarModeState(mode);
    localStorage.setItem("tenant-sidebar-mode", mode);

    if (mode === "collapsed" || mode === "hover") {
      setOpen(false);
    } else if (mode === "expanded") {
      setOpen(true);
    }
  }, []);

  const contextValue = React.useMemo(
    () => ({ sidebarMode, setSidebarMode, open, setOpen }),
    [sidebarMode, setSidebarMode, open]
  );

  return (
    <SidebarModeContext.Provider value={contextValue}>
      <div className={isInitialized ? "h-full w-full" : "invisible h-full w-full"}>
        {children}
      </div>
    </SidebarModeContext.Provider>
  );
}

export function useSidebarMode() {
  const context = React.useContext(SidebarModeContext);
  if (!context) {
    throw new Error("useSidebarMode must be used within a SidebarModeProvider");
  }
  return context;
}
