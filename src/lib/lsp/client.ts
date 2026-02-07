// Original: src/lib/lsp/client.ts
// Extracted: lib_lsp.js
// LSP client for code intelligence features

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspLocation {
  uri: string;
  range: { start: LspPosition; end: LspPosition };
}

export interface LspDiagnostic {
  range: { start: LspPosition; end: LspPosition };
  severity: number;
  message: string;
  source?: string;
}

export interface LspHoverResult {
  contents: string;
  range?: { start: LspPosition; end: LspPosition };
}

export interface LspSymbol {
  name: string;
  kind: number;
  location: LspLocation;
}

export class LspClient {
  private clients: Map<string, unknown> = new Map();

  async definition(uri: string, position: LspPosition): Promise<LspLocation | null> {
    // TODO: restore from lib_lsp.js
    return null;
  }

  async references(uri: string, position: LspPosition): Promise<LspLocation[]> {
    // TODO: restore from lib_lsp.js
    return [];
  }

  async hover(uri: string, position: LspPosition): Promise<LspHoverResult | null> {
    // TODO: restore from lib_lsp.js
    return null;
  }

  async documentSymbol(uri: string): Promise<LspSymbol[]> {
    // TODO: restore from lib_lsp.js
    return [];
  }

  async workspaceSymbol(query: string): Promise<LspSymbol[]> {
    // TODO: restore from lib_lsp.js
    return [];
  }

  async implementation(uri: string, position: LspPosition): Promise<LspLocation[]> {
    // TODO: restore from lib_lsp.js
    return [];
  }

  async diagnostics(uri: string): Promise<LspDiagnostic[]> {
    // TODO: restore from lib_lsp.js
    return [];
  }

  async touchFile(uri: string): Promise<void> {
    // TODO: restore from lib_lsp.js
  }

  hasClients(): boolean {
    return this.clients.size > 0;
  }

  isAvailable(): boolean {
    return this.hasClients();
  }

  formatDiagnostic(diag: LspDiagnostic): string {
    const severity = ["Error", "Warning", "Info", "Hint"][diag.severity - 1] || "Unknown";
    return `[${severity}] ${diag.message} (${diag.range.start.line}:${diag.range.start.character})`;
  }
}
