// Original: src/lib/treeSitter/embeddedAssets.ts
// Embedded WASM assets for tree-sitter
import * as path from "path";
import * as os from "os";

const ASSETS_DIR = "embedder-treesitter";

export function getWasmPath(wasmFile: string): string {
  return path.join(os.tmpdir(), ASSETS_DIR, wasmFile);
}

export async function extractTreeSitterAssets(): Promise<string> {
  const dir = path.join(os.tmpdir(), ASSETS_DIR);
  // TODO: restore - extract embedded WASM files to temp directory
  return dir;
}
