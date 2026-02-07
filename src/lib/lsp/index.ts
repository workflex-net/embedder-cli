// Original: src/lib/lsp/index.ts
// Re-exports for LSP module
export { LspClient } from "./client";
export { startLspServer } from "./server";
export { getLanguageForFile, supportedLanguages } from "./language";

import { LspClient } from "./client";

/** Singleton LSP client instance */
export const sC: LspClient = new LspClient();
