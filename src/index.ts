#!/usr/bin/env bun

import { existsSync, mkdirSync } from "fs";
import { Colors, DEFAULT_VERSION, BANNER, INSTALL_DIR } from "./constants";
import { parseArgs } from "./args";
import { detectPlatform } from "./platform";
import {
  resolveDownloadUrl,
  verifyRelease,
  downloadAndInstall,
  installFromBinary,
} from "./download";
import { installDependencies } from "./dependencies";
import { checkVersion } from "./version";
import { removeNpmGlobal } from "./npm";
import { clearCache } from "./cache";
import {
  configureShellPath,
  updateCurrentPath,
  configureGithubActions,
} from "./shell";

async function main(): Promise<void> {
  // Parse CLI arguments (skip first 2: bun, script path)
  const args = parseArgs(process.argv.slice(2));

  mkdirSync(INSTALL_DIR, { recursive: true });

  if (args.binaryPath) {
    // Install from local binary
    if (!existsSync(args.binaryPath)) {
      console.error(
        `${Colors.RED}Error: Binary not found at ${args.binaryPath}${Colors.NC}`
      );
      process.exit(1);
    }

    clearCache();
    await installFromBinary(args.binaryPath);
  } else {
    // Download and install from GitHub releases
    const platformInfo = await detectPlatform();

    const { url, version } = resolveDownloadUrl(platformInfo, args.requestedVersion);

    // Verify custom version exists on GitHub
    if (args.requestedVersion) {
      await verifyRelease(version);
    }

    await checkVersion(version);
    await removeNpmGlobal();
    clearCache();
    await downloadAndInstall(platformInfo, url, version);

    // Install dependencies (ripgrep, clangd, rust-analyzer)
    await installDependencies(platformInfo);
  }

  // Configure shell PATH
  configureShellPath(args.noModifyPath);
  updateCurrentPath();
  configureGithubActions();

  // Print banner
  console.log(BANNER);
  console.log(`${Colors.GREEN}Installation complete!${Colors.NC}`);
  console.log();
  console.log(`${Colors.BOLD}Open a new terminal, then:${Colors.NC}`);
  console.log();
  console.log(`  ${Colors.BOLD}cd your-project${Colors.NC}`);
  console.log(`  ${Colors.BOLD}embedder${Colors.NC}`);
  console.log();
}

main().catch((err) => {
  console.error(`${Colors.RED}Installation failed: ${err.message}${Colors.NC}`);
  process.exit(1);
});
