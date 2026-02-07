// Original: src/context/KeybindingContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

type KeybindingMode = "emacs" | "vim";

interface KeyMap {
  [key: string]: string;
}

interface KeybindingContextValue {
  mode: KeybindingMode;
  keyMap: KeyMap;
  setKeybindingMode: (mode: KeybindingMode) => void;
}

const KeybindingContext = createContext<KeybindingContextValue | null>(null);

const defaultKeyMaps: Record<KeybindingMode, KeyMap> = {
  emacs: {
    "Ctrl-A": "beginning-of-line",
    "Ctrl-E": "end-of-line",
    "Ctrl-K": "kill-line",
    "Ctrl-Y": "yank",
  },
  vim: {
    h: "move-left",
    j: "move-down",
    k: "move-up",
    l: "move-right",
    i: "insert-mode",
    Escape: "normal-mode",
  },
};

export function KeybindingProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<KeybindingMode>("emacs");

  const keyMap = useMemo(() => defaultKeyMaps[mode], [mode]);

  const setKeybindingMode = useCallback((newMode: KeybindingMode) => {
    setMode(newMode);
  }, []);

  const value = useMemo(
    () => ({ mode, keyMap, setKeybindingMode }),
    [mode, keyMap, setKeybindingMode]
  );

  return <KeybindingContext.Provider value={value}>{children}</KeybindingContext.Provider>;
}

export function useKeybinding() {
  const ctx = useContext(KeybindingContext);
  if (!ctx) throw new Error("useKeybinding must be used within KeybindingProvider");
  return ctx;
}
