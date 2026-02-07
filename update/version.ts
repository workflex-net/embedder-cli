import { Colors } from "./constants";
import { printMessage, execCommand, commandExists } from "./utils";

export async function checkVersion(specificVersion: string): Promise<void> {
  if (!(await commandExists("embedder"))) {
    return;
  }

  const { stdout: installedVersion } = await execCommand([
    "embedder",
    "--version",
  ]).catch(() => ({ stdout: "" }));

  if (installedVersion === specificVersion) {
    printMessage(
      "info",
      `${Colors.MUTED}Version ${Colors.NC}${specificVersion}${Colors.MUTED} already installed`
    );
    process.exit(0);
  } else if (installedVersion) {
    printMessage(
      "info",
      `${Colors.MUTED}Installed version: ${Colors.NC}${installedVersion}.`
    );
  }
}
