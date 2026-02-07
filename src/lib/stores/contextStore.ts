// Original: src/lib/stores/contextStore.ts
// Context store (zustand) for managing active context

interface ContextState {
  activeFiles: string[];
  remoteContext: Record<string, unknown>;
  addFile: (path: string) => void;
  removeFile: (path: string) => void;
  syncRemoteContext: () => Promise<void>;
}

// TODO: restore zustand store creation
// export const useContextStore = create<ContextState>(...)

export const useContextStore = (() => {
  const state: ContextState = {
    activeFiles: [],
    remoteContext: {},
    addFile: (_path: string) => {},
    removeFile: (_path: string) => {},
    syncRemoteContext: async () => {},
  };
  return () => state;
})();

/** Alias used in minified bundle */
export const GJB = useContextStore;
