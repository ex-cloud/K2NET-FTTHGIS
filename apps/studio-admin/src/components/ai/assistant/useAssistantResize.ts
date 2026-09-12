import { useState, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from "react";

export const DEFAULT_DRAWER_WIDTH = 580;
export const MIN_DRAWER_WIDTH = 460;
export const MAX_DRAWER_WIDTH = 1200;
export const STORAGE_WIDTH_KEY = "k2net_ai_drawer_width";

export function useAssistantResize() {
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WIDTH_KEY);
      if (saved) {
        const w = parseInt(saved, 10);
        if (w >= MIN_DRAWER_WIDTH && w <= MAX_DRAWER_WIDTH) setDrawerWidth(w);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const startResizing = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const onMove = (me: MouseEvent) => {
        const w = window.innerWidth - me.clientX;
        if (w >= MIN_DRAWER_WIDTH && w <= Math.min(MAX_DRAWER_WIDTH, window.innerWidth - 60)) {
          setDrawerWidth(w);
        }
      };
      const onUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        try {
          localStorage.setItem(STORAGE_WIDTH_KEY, String(drawerWidth));
        } catch {
          /* ignore */
        }
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [drawerWidth]
  );

  return { drawerWidth, isDragging, startResizing };
}
