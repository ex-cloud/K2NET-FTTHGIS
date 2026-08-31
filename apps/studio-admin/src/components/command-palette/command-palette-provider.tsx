

import React, { createContext, useContext } from "react";
import { useCommandPaletteState } from "./use-command-palette";
import { CommandPaletteModal } from "./command-palette-modal";

interface CommandPaletteContextType {
  isOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  isOpen: false,
  openCommandPalette: () => {},
  closeCommandPalette: () => {},
  toggleCommandPalette: () => {},
});

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen, open, close, toggle, query, setQuery } = useCommandPaletteState();

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        openCommandPalette: open,
        closeCommandPalette: close,
        toggleCommandPalette: toggle,
      }}
    >
      {children}
      <CommandPaletteModal
        open={isOpen}
        onOpenChange={setIsOpen}
        query={query}
        onQueryChange={setQuery}
        onClose={close}
      />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
