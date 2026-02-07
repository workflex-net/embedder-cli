// Platform detection

export function getPlatform(): NodeJS.Platform {
  return process.platform;
}

export function getArch(): string {
  return process.arch;
}

export function isWindows(): boolean {
  return process.platform === "win32";
}

export function isMac(): boolean {
  return process.platform === "darwin";
}

export function isLinux(): boolean {
  return process.platform === "linux";
}

export default { getPlatform, getArch, isWindows, isMac, isLinux };
