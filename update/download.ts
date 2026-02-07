import { mkdirSync, renameSync, chmodSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir, platform } from "os";
import {
  Colors,
  DEFAULT_VERSION,
  GITHUB_RELEASES_BASE,
  INSTALL_DIR,
} from "./constants";
import type { PlatformInfo } from "./platform";
import { printMessage, printProgress, execCommand } from "./utils";

export function resolveDownloadUrl(
  platformInfo: PlatformInfo,
  requestedVersion: string
): { url: string; version: string } {
  let version: string;
  if (!requestedVersion) {
    version = DEFAULT_VERSION;
  } else {
    version = requestedVersion.replace(/^v/, "");
  }

  const url = `${GITHUB_RELEASES_BASE}/download/v${version}/${platformInfo.binaryName}`;
  return { url, version };
}

export async function verifyRelease(version: string): Promise<void> {
  const tagUrl = `${GITHUB_RELEASES_BASE}/tag/v${version}`;
  const response = await fetch(tagUrl, { method: "HEAD", redirect: "follow" });

  if (response.status === 404) {
    printMessage(
      "error",
      `Error: Release v${version} not found`
    );
    printMessage(
      "info",
      `${Colors.MUTED}Available releases: ${GITHUB_RELEASES_BASE}${Colors.NC}`
    );
    process.exit(1);
  }
}

export async function downloadWithProgress(
  url: string,
  outputPath: string
): Promise<void> {
  const isTTY = process.stderr.isTTY;

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const contentLength = parseInt(
    response.headers.get("content-length") ?? "0",
    10
  );
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const chunks: Uint8Array[] = [];
  let received = 0;

  // Hide cursor
  if (isTTY) process.stderr.write("\x1b[?25l");

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (isTTY && contentLength > 0) {
        printProgress(received, contentLength);
      }
    }
  } finally {
    // Show cursor
    if (isTTY) process.stderr.write("\x1b[?25h");
  }

  if (isTTY) process.stderr.write("\n");

  // Write to file
  const fullBuffer = Buffer.concat(chunks);
  await Bun.write(outputPath, fullBuffer);
}

export async function downloadAndInstall(
  platformInfo: PlatformInfo,
  url: string,
  version: string
): Promise<void> {
  printMessage(
    "info",
    `\n${Colors.MUTED}Installing ${Colors.NC}embedder ${Colors.MUTED}version: ${Colors.NC}${version}`
  );

  mkdirSync(INSTALL_DIR, { recursive: true });

  const tmpDir = join(tmpdir(), `embedder_install_${process.pid}`);
  mkdirSync(tmpDir, { recursive: true });

  const tmpBinary = join(tmpDir, platformInfo.binaryName);

  try {
    if (platformInfo.os === "windows" || !process.stderr.isTTY) {
      // Simple download for Windows or non-TTY
      await downloadSimple(url, tmpBinary);
    } else {
      try {
        await downloadWithProgress(url, tmpBinary);
      } catch {
        // Fallback to simple download
        await downloadSimple(url, tmpBinary);
      }
    }

    const dest = join(INSTALL_DIR, "embedder");
    renameSync(tmpBinary, dest);
    chmodSync(dest, 0o755);

    // macOS: remove quarantine and re-sign
    if (platformInfo.os === "darwin") {
      await macosCodesign(dest);
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

export async function installFromBinary(
  binaryPath: string
): Promise<void> {
  printMessage(
    "info",
    `\n${Colors.MUTED}Installing ${Colors.NC}embedder ${Colors.MUTED}from: ${Colors.NC}${binaryPath}`
  );

  mkdirSync(INSTALL_DIR, { recursive: true });

  const dest = join(INSTALL_DIR, "embedder");
  const content = await Bun.file(binaryPath).arrayBuffer();
  await Bun.write(dest, content);
  chmodSync(dest, 0o755);

  // macOS: remove quarantine and re-sign
  if (platform() === "darwin") {
    await macosCodesign(dest);
  }
}

async function downloadSimple(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  await Bun.write(outputPath, buffer);
}

async function macosCodesign(binaryPath: string): Promise<void> {
  await execCommand([
    "xattr",
    "-d",
    "com.apple.quarantine",
    binaryPath,
  ]).catch(() => {});
  await execCommand([
    "codesign",
    "--remove-signature",
    binaryPath,
  ]).catch(() => {});
  await execCommand(["codesign", "-s", "-", binaryPath]).catch(() => {});
}
