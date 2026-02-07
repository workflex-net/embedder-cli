// Original: src/context/InputModeContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface InputModeContextValue {
  currentMode: string;
  switchInputMode: (mode: string) => void;
  availableModes: string[];
}

const InputModeContext = createContext<InputModeContextValue | null>(null);

export function InputModeProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<string>("text");
  const [availableModes] = useState<string[]>(["text", "voice", "touch", "stylus"]);

  const switchInputMode = useCallback(
    (mode: string) => {
      if (availableModes.includes(mode)) {
        setCurrentMode(mode);
      }
    },
    [availableModes]
  );

  const value = useMemo(
    () => ({ currentMode, switchInputMode, availableModes }),
    [currentMode, switchInputMode, availableModes]
  );

  return <InputModeContext.Provider value={value}>{children}</InputModeContext.Provider>;
}

export function useInputMode() {
  const ctx = useContext(InputModeContext);
  if (!ctx) throw new Error("useInputMode must be used within InputModeProvider");
  return ctx;
}
