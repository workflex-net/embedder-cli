import { existsSync, chmodSync, mkdirSync, rmSync, renameSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  Colors,
  INSTALL_DIR,
  RIPGREP_VERSION,
  CLANGD_VERSION,
  RUST_ANALYZER_VERSION,
} from "./constants";
import type { PlatformInfo } from "./platform";
import { printMessage, commandExists, execCommand } from "./utils";

async function macosCodesign(binaryPath: string): Promise<void> {
  await execCommand([
    "xattr",
    "-d",
    "com.apple.quarantine",
    binaryPath,
  ]).catch(() => {});
  await execCommand(["codesign", "-s", "-", binaryPath]).catch(() => {});
}

async function installRipgrep(platformInfo: PlatformInfo): Promise<void> {
  if (await commandExists("rg")) {
    printMessage("info", `${Colors.MUTED}ripgrep already installed${Colors.NC}`);
    return;
  }

  if (existsSync(join(INSTALL_DIR, "rg"))) {
    printMessage(
      "info",
      `${Colors.MUTED}ripgrep already installed in ${INSTALL_DIR}${Colors.NC}`
    );
    return;
  }

  printMessage("info", `${Colors.MUTED}Installing ripgrep...${Colors.NC}`);

  let rgTarget: string;
  switch (`${platformInfo.os}-${platformInfo.arch}`) {
    case "darwin-arm64":
      rgTarget = "aarch64-apple-darwin";
      break;
    case "darwin-x64":
      rgTarget = "x86_64-apple-darwin";
      break;
    case "linux-x64":
      rgTarget = "x86_64-unknown-linux-musl";
      break;
    default:
      printMessage(
        "warning",
        `Ripgrep not available for ${platformInfo.os}-${platformInfo.arch}, some features may not work`
      );
      return;
  }

  const rgUrl = `https://github.com/BurntSushi/ripgrep/releases/download/${RIPGREP_VERSION}/ripgrep-${RIPGREP_VERSION}-${rgTarget}.tar.gz`;
  const tmpDir = join(tmpdir(), `ripgrep_install_${process.pid}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const { exitCode } = await execCommand([
      "sh",
      "-c",
      `curl -sL "${rgUrl}" | tar -xz -C "${tmpDir}"`,
    ]);

    if (exitCode === 0) {
      const rgBinary = join(
        tmpDir,
        `ripgrep-${RIPGREP_VERSION}-${rgTarget}`,
        "rg"
      );
      const dest = join(INSTALL_DIR, "rg");
      renameSync(rgBinary, dest);
      chmodSync(dest, 0o755);

      if (platformInfo.os === "darwin") {
        await macosCodesign(dest);
      }
      printMessage("success", "ripgrep installed successfully");
    } else {
      printMessage(
        "warning",
        "Failed to install ripgrep, some features may not work"
      );
    }
  } catch {
    printMessage(
      "warning",
      "Failed to install ripgrep, some features may not work"
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function installClangd(platformInfo: PlatformInfo): Promise<void> {
  if (await commandExists("clangd")) {
    printMessage("info", `${Colors.MUTED}clangd already installed${Colors.NC}`);
    return;
  }

  if (existsSync(join(INSTALL_DIR, "clangd"))) {
    printMessage(
      "info",
      `${Colors.MUTED}clangd already installed in ${INSTALL_DIR}${Colors.NC}`
    );
    return;
  }

  printMessage("info", `${Colors.MUTED}Installing clangd...${Colors.NC}`);

  let clangdTarget: string;
  switch (`${platformInfo.os}-${platformInfo.arch}`) {
    case "darwin-arm64":
    case "darwin-x64":
      clangdTarget = `clangd-mac-${CLANGD_VERSION}`;
      break;
    case "linux-x64":
      clangdTarget = `clangd-linux-${CLANGD_VERSION}`;
      break;
    default:
      printMessage(
        "warning",
        `clangd not available for ${platformInfo.os}-${platformInfo.arch}, C/C++ LSP features may not work`
      );
      return;
  }

  const clangdUrl = `https://github.com/clangd/clangd/releases/download/${CLANGD_VERSION}/${clangdTarget}.zip`;
  const tmpDir = join(tmpdir(), `clangd_install_${process.pid}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const zipPath = join(tmpDir, "clangd.zip");

    const { exitCode: dlCode } = await execCommand([
      "curl",
      "-sL",
      clangdUrl,
      "-o",
      zipPath,
    ]);
    if (dlCode !== 0) throw new Error("Download failed");

    const { exitCode: unzipCode } = await execCommand([
      "unzip",
      "-q",
      zipPath,
      "-d",
      tmpDir,
    ]);
    if (unzipCode !== 0) throw new Error("Unzip failed");

    const clangdBinary = join(
      tmpDir,
      `clangd_${CLANGD_VERSION}`,
      "bin",
      "clangd"
    );
    const dest = join(INSTALL_DIR, "clangd");
    renameSync(clangdBinary, dest);
    chmodSync(dest, 0o755);

    if (platformInfo.os === "darwin") {
      await macosCodesign(dest);
    }
    printMessage("success", "clangd installed successfully");
  } catch {
    printMessage(
      "warning",
      "Failed to install clangd, C/C++ LSP features may not work"
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function installRustAnalyzer(
  platformInfo: PlatformInfo
): Promise<void> {
  if (await commandExists("rust-analyzer")) {
    printMessage(
      "info",
      `${Colors.MUTED}rust-analyzer already installed${Colors.NC}`
    );
    return;
  }

  if (existsSync(join(INSTALL_DIR, "rust-analyzer"))) {
    printMessage(
      "info",
      `${Colors.MUTED}rust-analyzer already installed in ${INSTALL_DIR}${Colors.NC}`
    );
    return;
  }

  printMessage(
    "info",
    `${Colors.MUTED}Installing rust-analyzer...${Colors.NC}`
  );

  let raTarget: string;
  switch (`${platformInfo.os}-${platformInfo.arch}`) {
    case "darwin-arm64":
      raTarget = "rust-analyzer-aarch64-apple-darwin";
      break;
    case "darwin-x64":
      raTarget = "rust-analyzer-x86_64-apple-darwin";
      break;
    case "linux-x64":
      raTarget = "rust-analyzer-x86_64-unknown-linux-gnu";
      break;
    default:
      printMessage(
        "warning",
        `rust-analyzer not available for ${platformInfo.os}-${platformInfo.arch}, Rust LSP features may not work`
      );
      return;
  }

  const raUrl = `https://github.com/rust-lang/rust-analyzer/releases/download/${RUST_ANALYZER_VERSION}/${raTarget}.gz`;
  const tmpDir = join(tmpdir(), `rust_analyzer_install_${process.pid}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    const raBinary = join(tmpDir, "rust-analyzer");

    const { exitCode } = await execCommand([
      "sh",
      "-c",
      `curl -sL "${raUrl}" | gunzip > "${raBinary}"`,
    ]);

    if (exitCode === 0) {
      const dest = join(INSTALL_DIR, "rust-analyzer");
      renameSync(raBinary, dest);
      chmodSync(dest, 0o755);

      if (platformInfo.os === "darwin") {
        await macosCodesign(dest);
      }
      printMessage("success", "rust-analyzer installed successfully");
    } else {
      printMessage(
        "warning",
        "Failed to install rust-analyzer, Rust LSP features may not work"
      );
    }
  } catch {
    printMessage(
      "warning",
      "Failed to install rust-analyzer, Rust LSP features may not work"
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

export async function installDependencies(
  platformInfo: PlatformInfo
): Promise<void> {
  printMessage(
    "info",
    `${Colors.MUTED}Installing dependencies...${Colors.NC}`
  );

  // Run all installations in parallel
  await Promise.all([
    installRipgrep(platformInfo),
    installClangd(platformInfo),
    installRustAnalyzer(platformInfo),
  ]);
}
