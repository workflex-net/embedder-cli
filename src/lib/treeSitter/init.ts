// Original: src/lib/treeSitter/init.ts
// Tree-sitter initialization

let initialized = false;
let parserInstance: unknown = null;

export function isInitialized(): boolean {
  return initialized;
}

export async function initTreeSitter(): Promise<void> {
  if (initialized) return;
  // TODO: restore - initialize tree-sitter WASM runtime
  // await Parser.init();
  // parserInstance = new Parser();
  initialized = true;
}

/** Parser instance - aliased as HW in minified bundle */
export const HW = {
  get instance(): unknown {
    return parserInstance;
  },
};
