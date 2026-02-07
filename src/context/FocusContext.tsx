// Original: src/context/FocusContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface FocusContextValue {
  focusedElement: string | null;
  setFocus: (elementId: string) => void;
  clearFocus: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const setFocus = useCallback((elementId: string) => {
    setFocusedElement(elementId);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedElement(null);
  }, []);

  const value = useMemo(
    () => ({ focusedElement, setFocus, clearFocus }),
    [focusedElement, setFocus, clearFocus]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used within FocusProvider");
  return ctx;
}
