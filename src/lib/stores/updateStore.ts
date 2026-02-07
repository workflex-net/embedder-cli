// Original: src/lib/stores/updateStore.ts
// Update store for application update state

interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
}

interface UpdateState {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  isDownloading: boolean;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

// TODO: restore zustand store creation
// export const useUpdateStore = create<UpdateState>(...)

export const useUpdateStore = (() => {
  const state: UpdateState = {
    updateAvailable: false,
    updateInfo: null,
    isChecking: false,
    isDownloading: false,
    checkForUpdates: async () => {},
    downloadUpdate: async () => {},
    dismissUpdate: () => {},
  };
  return () => state;
})();
