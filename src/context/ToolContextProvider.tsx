// Original: src/context/ToolContextProvider.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface PendingPermission {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface ToolContextValue {
  pendingPermission: PendingPermission | null;
  respondToPermission: (id: string, approved: boolean) => void;
  autoApprovalEnabled: boolean;
  toggleAutoApproval: () => void;
}

const ToolContext = createContext<ToolContextValue | null>(null);

export function ToolContextProvider({ children }: { children: React.ReactNode }) {
  const [pendingPermission, setPendingPermission] = useState<PendingPermission | null>(null);
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false);

  const respondToPermission = useCallback((id: string, approved: boolean) => {
    setPendingPermission((prev) => (prev?.id === id ? null : prev));
  }, []);

  const toggleAutoApproval = useCallback(() => {
    setAutoApprovalEnabled((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ pendingPermission, respondToPermission, autoApprovalEnabled, toggleAutoApproval }),
    [pendingPermission, respondToPermission, autoApprovalEnabled, toggleAutoApproval]
  );

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
}

export function useToolContext() {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useToolContext must be used within ToolContextProvider");
  return ctx;
}
