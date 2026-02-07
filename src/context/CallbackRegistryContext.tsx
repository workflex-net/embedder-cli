// Original: src/context/CallbackRegistryContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useRef, useMemo, useCallback } from "react";

type CallbackFn = (...args: unknown[]) => void;

interface CallbackRegistryContextValue {
  register: (name: string, callback: CallbackFn) => void;
  unregister: (name: string) => void;
  call: (name: string, ...args: unknown[]) => void;
  has: (name: string) => boolean;
}

const CallbackRegistryContext = createContext<CallbackRegistryContextValue | null>(null);

export function CallbackRegistryProvider({ children }: { children: React.ReactNode }) {
  const registryRef = useRef<Map<string, CallbackFn>>(new Map());

  const register = useCallback((name: string, callback: CallbackFn) => {
    registryRef.current.set(name, callback);
  }, []);

  const unregister = useCallback((name: string) => {
    registryRef.current.delete(name);
  }, []);

  const call = useCallback((name: string, ...args: unknown[]) => {
    const cb = registryRef.current.get(name);
    if (cb) cb(...args);
  }, []);

  const has = useCallback((name: string): boolean => {
    return registryRef.current.has(name);
  }, []);

  const value = useMemo(
    () => ({ register, unregister, call, has }),
    [register, unregister, call, has]
  );

  return (
    <CallbackRegistryContext.Provider value={value}>{children}</CallbackRegistryContext.Provider>
  );
}

export function useCallbackRegistry() {
  const ctx = useContext(CallbackRegistryContext);
  if (!ctx)
    throw new Error("useCallbackRegistry must be used within CallbackRegistryProvider");
  return ctx;
}
