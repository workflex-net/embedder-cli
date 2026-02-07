// Global zustand store

export interface GlobalState {
  projectPath: string | null;
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  setProjectPath: (path: string | null) => void;
  setConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Simple store implementation (zustand-compatible interface)
function createStore(): GlobalState & { getState: () => GlobalState } {
  const state: GlobalState = {
    projectPath: null,
    conversationId: null,
    isLoading: false,
    error: null,
    setProjectPath: (p) => {
      state.projectPath = p;
    },
    setConversationId: (id) => {
      state.conversationId = id;
    },
    setLoading: (loading) => {
      state.isLoading = loading;
    },
    setError: (error) => {
      state.error = error;
    },
  };

  return {
    ...state,
    getState: () => state,
  };
}

/** Global store hook (yB) */
export const yB = createStore();
export const useGlobalStore = yB;

export default yB;
