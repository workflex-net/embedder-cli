// Original: src/lib/stores/documentsStore.ts
// Documents store for managing uploaded/referenced documents

interface Document {
  id: string;
  name: string;
  content: string;
  mimeType: string;
  addedAt: number;
}

interface DocumentsState {
  documents: Document[];
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  getDocument: (id: string) => Document | undefined;
  clearDocuments: () => void;
}

// TODO: restore zustand store creation
// export const useDocumentsStore = create<DocumentsState>(...)

export const useDocumentsStore = (() => {
  const state: DocumentsState = {
    documents: [],
    addDocument: (_doc: Document) => {},
    removeDocument: (_id: string) => {},
    getDocument: (_id: string) => undefined,
    clearDocuments: () => {},
  };
  return () => state;
})();
