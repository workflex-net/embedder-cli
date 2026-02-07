// Original: src/lib/stores/serialStore.ts
// Serial store (zustand) for managing serial terminal tabs

interface SerialTab {
  id: string;
  port: string;
  baudRate: number;
  label: string;
  output: string[];
  unretrieved: string[];
}

interface SerialState {
  tabs: SerialTab[];
  activeTabId: string | null;
  getTabByPort: (port: string) => SerialTab | undefined;
  sendToPort: (port: string, data: string) => Promise<void>;
  getUnretrievedOutput: (port: string) => string[];
}

// TODO: restore zustand store creation
// export const fg = create<SerialState>(...)

export const fg = (() => {
  const state: SerialState = {
    tabs: [],
    activeTabId: null,
    getTabByPort: (_port: string) => undefined,
    sendToPort: async (_port: string, _data: string) => {},
    getUnretrievedOutput: (_port: string) => [],
  };
  return () => state;
})();

/** Alias for external usage */
export const useSerialStore = fg;
