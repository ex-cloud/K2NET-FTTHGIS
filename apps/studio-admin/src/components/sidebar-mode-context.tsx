

import * as React from "react";

export type SidebarMode = "expanded" | "collapsed" | "hover";

interface SidebarModeContextProps {
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarModeContext = React.createContext<SidebarModeContextProps | null>(
  null,
);

export function SidebarModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarMode, setSidebarModeState] =
    React.useState<SidebarMode>("expanded");
  // Start with a neutral or 'false' state to prevent flash opening
  const [open, setOpen] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize from localStorage immediately on mount
  React.useLayoutEffect(() => {
    const savedMode = localStorage.getItem("sidebar-mode") as SidebarMode;
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

  const setSidebarMode = (mode: SidebarMode) => {
    setSidebarModeState(mode);
    localStorage.setItem("sidebar-mode", mode);

    // Update 'open' state immediately when mode changes
    if (mode === "collapsed" || mode === "hover") {
      setOpen(false);
    } else if (mode === "expanded") {
      setOpen(true);
    }
  };

  return (
    <SidebarModeContext.Provider
      value={{ sidebarMode, setSidebarMode, open, setOpen }}
    >
      {/* Remove the blank screen, just let it render but use the state */}
      <div className={isInitialized ? "" : "invisible"}>{children}</div>
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
