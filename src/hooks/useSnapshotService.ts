// Original: src/hooks/useSnapshotService.ts
// Snapshot service hook for file state management
import { useCallback, useRef } from "react";

export interface FileSnapshot {
  path: string;
  content: string;
  timestamp: number;
}

export interface UseSnapshotServiceReturn {
  registerFile: (path: string, content: string) => void;
  takeSnapshot: () => Map<string, FileSnapshot>;
  restoreSnapshot: (snapshot: Map<string, FileSnapshot>) => void;
}

export function useSnapshotService(): UseSnapshotServiceReturn {
  const filesRef = useRef<Map<string, FileSnapshot>>(new Map());

  const registerFile = useCallback((path: string, content: string) => {
    filesRef.current.set(path, { path, content, timestamp: Date.now() });
  }, []);

  const takeSnapshot = useCallback((): Map<string, FileSnapshot> => {
    return new Map(filesRef.current);
  }, []);

  const restoreSnapshot = useCallback((snapshot: Map<string, FileSnapshot>) => {
    filesRef.current = new Map(snapshot);
  }, []);

  return { registerFile, takeSnapshot, restoreSnapshot };
}
