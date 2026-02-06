import { Colors } from "./constants";
import { printMessage, execCommand, commandExists } from "./utils";

export async function removeNpmGlobal(): Promise<void> {
  if (!(await commandExists("npm"))) {
    return;
  }

  const { stdout: npmListOutput } = await execCommand([
    "npm",
    "list",
    "-g",
    "@embedder/embedder",
  ]).catch(() => ({ stdout: "" }));

  if (!npmListOutput.includes("@embedder/embedder@")) {
    return;
  }

  printMessage(
    "info",
    "Found global npm installation of @embedder/embedder, removing..."
  );

  // Try without sudo first
  const { exitCode } = await execCommand([
    "npm",
    "uninstall",
    "-g",
    "@embedder/embedder",
  ]);

  if (exitCode === 0) {
    printMessage(
      "success",
      "Successfully removed npm global @embedder/embedder"
    );
    return;
  }

  // Retry with sudo
  printMessage(
    "warning",
    "Retrying with sudo (you may be prompted for your password)..."
  );

  // Show cursor so user can enter password
  process.stderr.write("\x1b[?25h");

  const { exitCode: sudoExitCode } = await execCommand([
    "sudo",
    "npm",
    "uninstall",
    "-g",
    "@embedder/embedder",
  ]);

  // Hide cursor again
  process.stderr.write("\x1b[?25l");

  if (sudoExitCode === 0) {
    printMessage(
      "success",
      "Successfully removed npm global @embedder/embedder with sudo"
    );
  } else {
    printMessage(
      "warning",
      "Could not remove npm global @embedder/embedder. You may need to remove it manually:"
    );
    printMessage("info", "  sudo npm uninstall -g @embedder/embedder");
  }
}
