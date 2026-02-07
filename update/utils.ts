import { Colors } from "./constants";

export type LogLevel = "info" | "success" | "warning" | "error";

export function printMessage(level: LogLevel, message: string): void {
  const colorMap: Record<LogLevel, string> = {
    info: Colors.NC,
    success: Colors.GREEN,
    warning: Colors.ORANGE,
    error: Colors.RED,
  };
  const color = colorMap[level];
  process.stderr.write(`${color}${message}${Colors.NC}\n`);
}

export function usage(): void {
  console.log(`Embedder CLI Installer

Usage: install.sh [options]

Options:
    -h, --help              Display this help message
    -v, --version <version> Install a specific version (e.g., 3.0.0)
    -b, --binary <path>     Install from a local binary instead of downloading
        --no-modify-path    Don't modify shell config files (.zshrc, .bashrc, etc.)

Examples:
    curl -fsSL https://embedder.com/install | bash
    curl -fsSL https://embedder.com/install | bash -s -- --version 3.0.0
    ./install.sh --binary /path/to/embedder-cli`);
}

export function printProgress(bytes: number, total: number): void {
  if (total <= 0) return;

  const width = 50;
  let percent = Math.floor((bytes * 100) / total);
  if (percent > 100) percent = 100;

  const on = Math.floor((percent * width) / 100);
  const off = width - on;

  const filled = "■".repeat(on);
  const empty = "･".repeat(off);

  process.stderr.write(
    `\r${Colors.ORANGE}${filled}${empty} ${String(percent).padStart(3)}%${Colors.NC}`
  );
}

export async function execCommand(
  cmd: string[],
  options?: { silent?: boolean }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

export async function commandExists(command: string): Promise<boolean> {
  const result = await execCommand(["which", command]);
  return result.exitCode === 0;
}
