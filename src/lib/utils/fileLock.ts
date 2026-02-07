// File locking

import * as fs from "fs";
import * as path from "path";

const LOCK_STALE_MS = 10_000;

export function acquireLock(lockPath: string, timeout: number = 5000): boolean {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      // Check for stale lock
      if (fs.existsSync(lockPath)) {
        const stat = fs.statSync(lockPath);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          fs.unlinkSync(lockPath);
        } else {
          // Lock is held, wait
          const waitMs = Math.min(50, deadline - Date.now());
          if (waitMs > 0) {
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
          }
          continue;
        }
      }

      // Try to acquire
      fs.mkdirSync(path.dirname(lockPath), { recursive: true });
      fs.writeFileSync(lockPath, `${process.pid}`, { flag: "wx" });
      return true;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "EEXIST") {
        continue;
      }
      return false;
    }
  }

  return false;
}

export function releaseLock(lockPath: string): void {
  try {
    fs.unlinkSync(lockPath);
  } catch {
    // Lock already released
  }
}

/** Execute a function while holding a file lock (Hu) */
export async function Hu<T>(
  lockPath: string,
  fn: () => Promise<T> | T,
  timeout?: number,
): Promise<T> {
  if (!acquireLock(lockPath, timeout)) {
    throw new Error(`Failed to acquire lock: ${lockPath}`);
  }

  try {
    return await fn();
  } finally {
    releaseLock(lockPath);
  }
}
export const withFileLock = Hu;

export default { withFileLock, acquireLock, releaseLock };
