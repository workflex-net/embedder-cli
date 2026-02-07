// Original: src/context/ToolStreamingContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface StreamData {
  id: string;
  lines: string[];
  tokenCount: number;
}

interface ToolStreamingContextValue {
  streams: Map<string, StreamData>;
  updateStream: (id: string, line: string, tokens: number) => void;
  clearStream: (id: string) => void;
  totalLineCount: number;
  totalTokenCount: number;
}

const ToolStreamingContext = createContext<ToolStreamingContextValue | null>(null);

export function ToolStreamingProvider({ children }: { children: React.ReactNode }) {
  const [streams, setStreams] = useState<Map<string, StreamData>>(new Map());

  const updateStream = useCallback((id: string, line: string, tokens: number) => {
    setStreams((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) ?? { id, lines: [], tokenCount: 0 };
      next.set(id, {
        ...existing,
        lines: [...existing.lines, line],
        tokenCount: existing.tokenCount + tokens,
      });
      return next;
    });
  }, []);

  const clearStream = useCallback((id: string) => {
    setStreams((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const totalLineCount = useMemo(() => {
    let count = 0;
    streams.forEach((s) => (count += s.lines.length));
    return count;
  }, [streams]);

  const totalTokenCount = useMemo(() => {
    let count = 0;
    streams.forEach((s) => (count += s.tokenCount));
    return count;
  }, [streams]);

  const value = useMemo(
    () => ({ streams, updateStream, clearStream, totalLineCount, totalTokenCount }),
    [streams, updateStream, clearStream, totalLineCount, totalTokenCount]
  );

  return <ToolStreamingContext.Provider value={value}>{children}</ToolStreamingContext.Provider>;
}

export function useToolStreaming() {
  const ctx = useContext(ToolStreamingContext);
  if (!ctx) throw new Error("useToolStreaming must be used within ToolStreamingProvider");
  return ctx;
}
