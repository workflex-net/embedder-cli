// /home/leo/work/embedder/src/types/lsp.ts
// LSP types for language server protocol operations, diagnostics, and code navigation.

export type LspOperation =
  | "initialize"
  | "textDocument/completion"
  | "textDocument/hover"
  | "textDocument/definition"
  | "textDocument/references"
  | "textDocument/rename"
  | "textDocument/formatting"
  | "textDocument/diagnostics"
  | "textDocument/signatureHelp"
  | "textDocument/codeAction"
  | "workspace/symbol"
  | "shutdown";

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface LspLocation {
  uri: string;
  range: LspRange;
}

export type DiagnosticSeverity = "error" | "warning" | "information" | "hint";

export interface Diagnostic {
  range: LspRange;
  severity: DiagnosticSeverity;
  code?: string | number;
  source?: string;
  message: string;
  relatedInformation?: DiagnosticRelatedInfo[];
  tags?: DiagnosticTag[];
}

export type DiagnosticTag = "unnecessary" | "deprecated";

export interface DiagnosticRelatedInfo {
  location: LspLocation;
  message: string;
}

export type LspResult =
  | LspCompletionResult
  | LspHoverResult
  | LspDefinitionResult
  | LspReferencesResult
  | LspDiagnosticsResult
  | LspRenameResult
  | LspFormattingResult
  | LspCodeActionResult;

export interface LspCompletionResult {
  type: "completion";
  items: CompletionEntry[];
  isIncomplete: boolean;
}

export interface CompletionEntry {
  label: string;
  kind: CompletionKind;
  detail?: string;
  documentation?: string;
  insertText: string;
  sortText?: string;
  filterText?: string;
}

export type CompletionKind =
  | "function"
  | "variable"
  | "class"
  | "interface"
  | "module"
  | "property"
  | "field"
  | "keyword"
  | "snippet"
  | "constant"
  | "enum"
  | "struct"
  | "macro";

export interface LspHoverResult {
  type: "hover";
  contents: string;
  range?: LspRange;
}

export interface LspDefinitionResult {
  type: "definition";
  locations: LspLocation[];
}

export interface LspReferencesResult {
  type: "references";
  locations: LspLocation[];
}

export interface LspDiagnosticsResult {
  type: "diagnostics";
  uri: string;
  diagnostics: Diagnostic[];
}

export interface LspRenameResult {
  type: "rename";
  changes: Record<string, TextEdit[]>;
}

export interface LspFormattingResult {
  type: "formatting";
  edits: TextEdit[];
}

export interface LspCodeActionResult {
  type: "codeAction";
  actions: CodeAction[];
}

export interface TextEdit {
  range: LspRange;
  newText: string;
}

export interface CodeAction {
  title: string;
  kind: string;
  diagnostics?: Diagnostic[];
  edits?: Record<string, TextEdit[]>;
  isPreferred?: boolean;
}

export interface LspServerConfig {
  command: string;
  args: string[];
  rootUri: string;
  languageId: string;
  initializationOptions?: Record<string, unknown>;
}

export type LspServerState =
  | "stopped"
  | "starting"
  | "running"
  | "error";
