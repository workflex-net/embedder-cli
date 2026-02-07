import { platform, arch as osArch } from "os";
import { existsSync } from "fs";
import { readFileSync } from "fs";
import { Colors } from "./constants";
import { execCommand } from "./utils";

export interface PlatformInfo {
  os: string;
  arch: string;
  target: string;
  binaryName: string;
  isMusl: boolean;
  needsBaseline: boolean;
}

export async function detectPlatform(): Promise<PlatformInfo> {
  // Detect OS
  let os: string;
  const rawPlatform = platform();
  switch (rawPlatform) {
    case "darwin":
      os = "darwin";
      break;
    case "linux":
      os = "linux";
      break;
    case "win32":
      os = "windows";
      break;
    default:
      console.error(`${Colors.RED}Unsupported OS: ${rawPlatform}${Colors.NC}`);
      process.exit(1);
  }

  // Detect architecture
  let arch: string;
  const rawArch = osArch();
  switch (rawArch) {
    case "arm64":
      arch = "arm64";
      break;
    case "x64":
      arch = "x64";
      break;
    case "ia32":
      arch = "x64"; // fallback
      break;
    default:
      arch = rawArch;
  }

  // macOS Rosetta detection
  if (os === "darwin" && arch === "x64") {
    const { stdout } = await execCommand([
      "sysctl",
      "-n",
      "sysctl.proc_translated",
    ]);
    if (stdout === "1") {
      arch = "arm64";
    }
  }

  // Validate platform combination
  const combo = `${os}-${arch}`;
  const supported = ["linux-x64", "darwin-x64", "darwin-arm64", "windows-x64"];
  if (combo === "linux-arm64") {
    console.error(`${Colors.RED}Linux ARM64 is not yet supported.${Colors.NC}`);
    console.error(
      `${Colors.MUTED}Supported platforms: Linux x64, macOS (Intel/Apple Silicon), Windows x64${Colors.NC}`
    );
    process.exit(1);
  }
  if (!supported.includes(combo)) {
    console.error(
      `${Colors.RED}Unsupported OS/Arch: ${os}/${arch}${Colors.NC}`
    );
    process.exit(1);
  }

  // Detect musl libc (Linux only)
  let isMusl = false;
  if (os === "linux") {
    if (existsSync("/etc/alpine-release")) {
      isMusl = true;
    }
    const { stdout: lddOutput } = await execCommand(["ldd", "--version"]).catch(
      () => ({ stdout: "" })
    );
    if (lddOutput.toLowerCase().includes("musl")) {
      isMusl = true;
    }
  }

  // Detect baseline CPU (no AVX2 support)
  let needsBaseline = false;
  if (arch === "x64") {
    if (os === "linux") {
      try {
        const cpuinfo = readFileSync("/proc/cpuinfo", "utf-8");
        if (!cpuinfo.toLowerCase().includes("avx2")) {
          needsBaseline = true;
        }
      } catch {
        // If we can't read cpuinfo, assume baseline
        needsBaseline = true;
      }
    }
    if (os === "darwin") {
      const { stdout } = await execCommand([
        "sysctl",
        "-n",
        "hw.optional.avx2_0",
      ]).catch(() => ({ stdout: "0" }));
      if (stdout !== "1") {
        needsBaseline = true;
      }
    }
  }

  // Build target string
  let target = `${os}-${arch}`;
  if (needsBaseline) {
    target += "-baseline";
  }
  if (isMusl) {
    target += "-musl";
  }

  // Map target to binary name
  let binaryName: string;
  switch (true) {
    case target.startsWith("darwin-x64"):
      binaryName = "embedder-cli-darwin";
      break;
    case target === "darwin-arm64":
      binaryName = "embedder-cli-darwin-arm64";
      break;
    case target.startsWith("linux-x64"):
      binaryName = "embedder-cli-linux";
      break;
    case target.startsWith("windows-x64"):
      binaryName = "embedder-cli.exe";
      break;
    default:
      console.error(
        `${Colors.RED}Unsupported target: ${target}${Colors.NC}`
      );
      process.exit(1);
  }

  return { os, arch, target, binaryName, isMusl, needsBaseline };
}
