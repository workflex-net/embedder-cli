// Original: src/context/FilesContext.tsx
// Extracted: context.js

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";

interface FileEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
}

interface FilesContextValue {
  files: FileEntry[];
  isLoading: boolean;
  searchFiles: (query: string) => FileEntry[];
  refreshFiles: () => Promise<void>;
}

const FilesContext = createContext<FilesContextValue | null>(null);

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchFiles = useCallback(
    (query: string): FileEntry[] => {
      const lower = query.toLowerCase();
      return files.filter(
        (f) => f.name.toLowerCase().includes(lower) || f.path.toLowerCase().includes(lower)
      );
    },
    [files]
  );

  const refreshFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      setFiles(data.files ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ files, isLoading, searchFiles, refreshFiles }),
    [files, isLoading, searchFiles, refreshFiles]
  );

  return <FilesContext.Provider value={value}>{children}</FilesContext.Provider>;
}

export function useFiles() {
  const ctx = useContext(FilesContext);
  if (!ctx) throw new Error("useFiles must be used within FilesProvider");
  return ctx;
}
