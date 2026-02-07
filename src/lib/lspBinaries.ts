// LSP binary management

import * as fs from "fs";
import * as path from "path";
import { getCacheDir } from "./paths";
import { getPlatform, getArch } from "./platform";

function getLspDir(): string {
  return path.join(getCacheDir(), "lsp-binaries");
}

export function getLspPath(serverName: string): string {
  const platform = getPlatform();
  const arch = getArch();
  const ext = platform === "win32" ? ".exe" : "";
  return path.join(getLspDir(), `${serverName}-${platform}-${arch}${ext}`);
}

export async function ensureLspBinaries(
  servers: string[] = ["clangd"],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const server of servers) {
    const binPath = getLspPath(server);

    if (fs.existsSync(binPath)) {
      result[server] = binPath;
    } else {
      // Binary needs to be downloaded
      const dir = path.dirname(binPath);
      fs.mkdirSync(dir, { recursive: true });
      // Download logic would be implemented here
      result[server] = binPath;
    }
  }

  return result;
}

export default { ensureLspBinaries, getLspPath };
