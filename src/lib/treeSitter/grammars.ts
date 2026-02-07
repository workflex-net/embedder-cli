// Original: src/lib/treeSitter/grammars.ts
// Grammar loading for tree-sitter parsers

export interface GrammarInfo {
  language: string;
  wasmFile: string;
}

export const availableGrammars: GrammarInfo[] = [
  { language: "typescript", wasmFile: "tree-sitter-typescript.wasm" },
  { language: "tsx", wasmFile: "tree-sitter-tsx.wasm" },
  { language: "javascript", wasmFile: "tree-sitter-javascript.wasm" },
  { language: "python", wasmFile: "tree-sitter-python.wasm" },
  { language: "rust", wasmFile: "tree-sitter-rust.wasm" },
  { language: "go", wasmFile: "tree-sitter-go.wasm" },
  { language: "c", wasmFile: "tree-sitter-c.wasm" },
  { language: "cpp", wasmFile: "tree-sitter-cpp.wasm" },
  { language: "java", wasmFile: "tree-sitter-java.wasm" },
  { language: "ruby", wasmFile: "tree-sitter-ruby.wasm" },
];

const loadedGrammars: Map<string, unknown> = new Map();

export async function loadGrammar(language: string): Promise<unknown> {
  if (loadedGrammars.has(language)) {
    return loadedGrammars.get(language)!;
  }
  // TODO: restore - load WASM grammar via tree-sitter
  return null;
}

export function getGrammarForLanguage(language: string): GrammarInfo | undefined {
  return availableGrammars.find((g) => g.language === language);
}
