// Original: src/context/TreeSitterContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface TreeSitterContextValue {
  isInitialized: boolean;
  parseFile: (content: string, language: string) => Promise<unknown>;
  getLanguage: (filename: string) => string | null;
}

const TreeSitterContext = createContext<TreeSitterContextValue | null>(null);

export function TreeSitterProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized] = useState(false);

  const parseFile = useCallback(async (content: string, language: string): Promise<unknown> => {
    if (!isInitialized) throw new Error("TreeSitter not initialized");
    return null;
  }, [isInitialized]);

  const getLanguage = useCallback((filename: string): string | null => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "tsx",
      js: "javascript",
      jsx: "jsx",
      py: "python",
      rs: "rust",
      go: "go",
    };
    return ext ? languageMap[ext] ?? null : null;
  }, []);

  const value = useMemo(
    () => ({ isInitialized, parseFile, getLanguage }),
    [isInitialized, parseFile, getLanguage]
  );

  return <TreeSitterContext.Provider value={value}>{children}</TreeSitterContext.Provider>;
}

export function useTreeSitter() {
  const ctx = useContext(TreeSitterContext);
  if (!ctx) throw new Error("useTreeSitter must be used within TreeSitterProvider");
  return ctx;
}
