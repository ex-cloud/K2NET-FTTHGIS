

import { useState, useCallback, useEffect } from "react";

export function useCommandPaletteState() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
    toggle,
    open,
    close,
    query,
    setQuery,
  };
}
