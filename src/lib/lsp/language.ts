// Original: src/lib/lsp/language.ts
// Language detection for LSP

/** Supported file extensions */
export const qN: string[] = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".rs",
  ".go",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".java",
  ".rb",
  ".lua",
  ".zig",
  ".swift",
  ".kt",
  ".cs",
];

export const supportedLanguages: string[] = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "c",
  "cpp",
  "java",
  "ruby",
  "lua",
  "zig",
  "swift",
  "kotlin",
  "csharp",
];

const extensionToLanguage: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".java": "java",
  ".rb": "ruby",
  ".lua": "lua",
  ".zig": "zig",
  ".swift": "swift",
  ".kt": "kotlin",
  ".cs": "csharp",
};

export function getLanguageForFile(filePath: string): string | null {
  const ext = filePath.slice(filePath.lastIndexOf("."));
  return extensionToLanguage[ext] || null;
}
