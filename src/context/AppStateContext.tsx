// Original: src/context/AppStateContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

type AppStatus = "initializing" | "ready" | "error" | "offline";

interface AppStateContextValue {
  status: AppStatus;
  setStatus: (status: AppStatus) => void;
  isReady: boolean;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusRaw] = useState<AppStatus>("initializing");

  const setStatus = useCallback((newStatus: AppStatus) => {
    setStatusRaw(newStatus);
  }, []);

  const isReady = useMemo(() => status === "ready", [status]);

  const value = useMemo(
    () => ({ status, setStatus, isReady }),
    [status, setStatus, isReady]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
