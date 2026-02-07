// Original: src/lib/services/documentUpload.ts
// Document upload and processing

export interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  mimeType: string;
  size: number;
}

export async function uploadDocument(
  filePath: string,
  mimeType?: string,
): Promise<UploadedDocument> {
  // TODO: restore - read file and process for context injection
  return {
    id: `doc-${Date.now()}`,
    name: filePath.split("/").pop() || filePath,
    content: "",
    mimeType: mimeType || "text/plain",
    size: 0,
  };
}

export async function processDocument(doc: UploadedDocument): Promise<string> {
  // TODO: restore - extract text content based on mime type (PDF, images, etc.)
  return doc.content;
}
