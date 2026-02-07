// Exit handling

type CleanupFn = () => void | Promise<void>;

const cleanupHandlers: CleanupFn[] = [];
let exitRegistered = false;

export function registerCleanup(handler: CleanupFn): void {
  cleanupHandlers.push(handler);

  if (!exitRegistered) {
    exitRegistered = true;
    process.on("beforeExit", runCleanup);
    process.on("SIGINT", () => VF(130));
    process.on("SIGTERM", () => VF(143));
  }
}

async function runCleanup(): Promise<void> {
  for (const handler of cleanupHandlers) {
    try {
      await handler();
    } catch {
      // Ignore cleanup errors during exit
    }
  }
}

/** Exit the application (VF) */
export async function VF(code: number = 0): Promise<never> {
  await runCleanup();
  process.exit(code);
}
export const exitApp = VF;

export default { exitApp, registerCleanup };
