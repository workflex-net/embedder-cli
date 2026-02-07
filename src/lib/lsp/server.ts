// Original: src/lib/lsp/server.ts
// LSP server management - start/stop language servers
import type { ChildProcess } from "child_process";

export interface LspServerConfig {
  language: string;
  command: string;
  args: string[];
  rootUri: string;
}

const activeServers: Map<string, ChildProcess> = new Map();

export async function startLspServer(config: LspServerConfig): Promise<void> {
  // TODO: restore from lib_lsp.js - spawn LSP server process
  // const proc = spawn(config.command, config.args);
  // activeServers.set(config.language, proc);
}

export async function stopLspServer(language: string): Promise<void> {
  const proc = activeServers.get(language);
  if (proc) {
    proc.kill();
    activeServers.delete(language);
  }
}
