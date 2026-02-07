// Original: src/context/SessionContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface SessionContextValue {
  sessionId: string | null;
  sessionSlug: string | null;
  sessionCreatedAt: Date | null;
  isCreating: boolean;
  refreshSession: () => Promise<void>;
  folderType: string;
  sandboxType: string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionSlug, setSessionSlug] = useState<string | null>(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<Date | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [folderType, setFolderType] = useState<string>("default");
  const [sandboxType, setSandboxType] = useState<string>("none");

  const refreshSession = useCallback(async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/sessions/new", { method: "POST" });
      const data = await res.json();
      setSessionId(data.id);
      setSessionSlug(data.slug);
      setSessionCreatedAt(new Date(data.createdAt));
      setFolderType(data.folderType ?? "default");
      setSandboxType(data.sandboxType ?? "none");
    } finally {
      setIsCreating(false);
    }
  }, []);

  const value = useMemo(
    () => ({ sessionId, sessionSlug, sessionCreatedAt, isCreating, refreshSession, folderType, sandboxType }),
    [sessionId, sessionSlug, sessionCreatedAt, isCreating, refreshSession, folderType, sandboxType]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
