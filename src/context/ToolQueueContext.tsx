// Original: src/context/ToolQueueContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface ToolQueueItem {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface ToolQueueContextValue {
  queue: ToolQueueItem[];
  enqueue: (item: ToolQueueItem) => void;
  dequeue: () => ToolQueueItem | undefined;
  currentTool: ToolQueueItem | null;
}

const ToolQueueContext = createContext<ToolQueueContextValue | null>(null);

export function ToolQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ToolQueueItem[]>([]);
  const [currentTool, setCurrentTool] = useState<ToolQueueItem | null>(null);

  const enqueue = useCallback((item: ToolQueueItem) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const dequeue = useCallback(() => {
    let removed: ToolQueueItem | undefined;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      [removed] = prev;
      setCurrentTool(removed ?? null);
      return prev.slice(1);
    });
    return removed;
  }, []);

  const value = useMemo(
    () => ({ queue, enqueue, dequeue, currentTool }),
    [queue, enqueue, dequeue, currentTool]
  );

  return <ToolQueueContext.Provider value={value}>{children}</ToolQueueContext.Provider>;
}

export function useToolQueue() {
  const ctx = useContext(ToolQueueContext);
  if (!ctx) throw new Error("useToolQueue must be used within ToolQueueProvider");
  return ctx;
}
