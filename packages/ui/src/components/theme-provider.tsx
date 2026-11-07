import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type Theme = "dark" | "light" | "system";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
  systemTheme: "dark" | "light";
}

interface DocumentWithViewTransition {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "dark",
  systemTheme: "dark",
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveThemeValue(theme: Theme, systemPref: "dark" | "light"): "dark" | "light" {
  if (theme === "system") return systemPref;
  return theme === "light" ? "light" : "dark";
}

function applyResolvedThemeToDOM(root: HTMLElement, resolved: "dark" | "light") {
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "k2net-theme",
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(getSystemPreference);
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const saved =
      (localStorage.getItem(storageKey) as Theme | null) ||
      (localStorage.getItem("k2net-theme") as Theme | null) ||
      (localStorage.getItem("k2net-admin-theme") as Theme | null);
    return saved || defaultTheme;
  });

  const transitionTimeoutRef = useRef<number | null>(null);
  const resolvedTheme = resolveThemeValue(theme, systemTheme);

  // Sync DOM class on initial mount & when OS preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    applyResolvedThemeToDOM(root, resolvedTheme);
  }, [resolvedTheme]);

  // Listen to OS dark/light mode changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Cleanup any pending fallback timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null && typeof window !== "undefined") {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      if (typeof window === "undefined") {
        setThemeState(nextTheme);
        return;
      }

      try {
        localStorage.setItem(storageKey, nextTheme);
        // Keep both admin & tenant keys aligned on the same browser origin
        localStorage.setItem("k2net-theme", nextTheme);
      } catch {
        // Ignore storage quota / private mode errors
      }

      const currentSys = getSystemPreference();
      const currentResolved = resolveThemeValue(theme, currentSys);
      const nextResolved = resolveThemeValue(nextTheme, currentSys);
      const root = window.document.documentElement;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // If visual mode doesn't change or transitions are disabled, update immediately
      if (disableTransitionOnChange || prefersReducedMotion || currentResolved === nextResolved) {
        applyResolvedThemeToDOM(root, nextResolved);
        setThemeState(nextTheme);
        return;
      }

      const docWithVT = window.document as Document & DocumentWithViewTransition;

      // Layer 1: Native GPU View Transitions API (60-120fps compositor cross-fade)
      if (typeof docWithVT.startViewTransition === "function") {
        root.setAttribute("data-view-transition-active", "true");
        try {
          const transition = docWithVT.startViewTransition(() => {
            applyResolvedThemeToDOM(root, nextResolved);
            setThemeState(nextTheme);
          });
          transition.finished.finally(() => {
            root.removeAttribute("data-view-transition-active");
          });
          return;
        } catch {
          root.removeAttribute("data-view-transition-active");
        }
      }

      // Layer 2: Synchronized CSS lockstep fallback for older browsers
      root.setAttribute("data-theme-transitioning", "true");
      applyResolvedThemeToDOM(root, nextResolved);
      setThemeState(nextTheme);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
      transitionTimeoutRef.current = window.setTimeout(() => {
        root.removeAttribute("data-theme-transitioning");
        transitionTimeoutRef.current = null;
      }, 280);
    },
    [disableTransitionOnChange, storageKey, theme]
  );

  const value: ThemeProviderState = {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
