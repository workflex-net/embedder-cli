// Original: src/context/ModeContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

type Mode = "plan" | "act";

interface ModeContextValue {
  mode: Mode;
  setMode: (mode: Mode) => void;
  switchMode: () => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("plan");

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === "plan" ? "act" : "plan"));
  }, []);

  const value = useMemo(() => ({ mode, setMode, switchMode }), [mode, switchMode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
