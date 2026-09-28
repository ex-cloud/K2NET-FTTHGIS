import * as React from "react";

export type SidebarMode = "expanded" | "collapsed" | "hover";

export interface SidebarModeContextProps {
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarModeContext = React.createContext<SidebarModeContextProps | null>(null);

export interface SidebarModeProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  defaultMode?: SidebarMode;
}

export function SidebarModeProvider({
  children,
  storageKey = "sidebar-mode",
  defaultMode = "expanded",
}: SidebarModeProviderProps) {
  const [sidebarMode, setSidebarModeState] = React.useState<SidebarMode>(defaultMode);
  const [open, setOpen] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize from localStorage immediately on mount
  React.useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedMode = localStorage.getItem(storageKey) as SidebarMode | null;
      const mode =
        savedMode && ["expanded", "collapsed", "hover"].includes(savedMode)
          ? savedMode
          : defaultMode;

      setSidebarModeState(mode);
      if (mode === "collapsed" || mode === "hover") {
        setOpen(false);
      } else {
        setOpen(true);
      }
    } catch {
      // Fallback gracefully if localStorage is restricted
      setSidebarModeState(defaultMode);
      setOpen(defaultMode === "expanded");
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey, defaultMode]);

  const setSidebarMode = React.useCallback(
    (mode: SidebarMode) => {
      setSidebarModeState(mode);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, mode);
        }
      } catch {
        // Silently catch quota or privacy restriction errors
      }

      if (mode === "collapsed" || mode === "hover") {
        setOpen(false);
      } else if (mode === "expanded") {
        setOpen(true);
      }
    },
    [storageKey]
  );

  const contextValue = React.useMemo(
    () => ({ sidebarMode, setSidebarMode, open, setOpen }),
    [sidebarMode, setSidebarMode, open]
  );

  return (
    <SidebarModeContext.Provider value={contextValue}>
      <div className={isInitialized ? "" : "invisible"}>{children}</div>
    </SidebarModeContext.Provider>
  );
}

const defaultContext: SidebarModeContextProps = {
  sidebarMode: "expanded",
  setSidebarMode: () => {},
  open: true,
  setOpen: () => {},
};

export function useSidebarMode(): SidebarModeContextProps {
  const context = React.useContext(SidebarModeContext);
  return context || defaultContext;
}
