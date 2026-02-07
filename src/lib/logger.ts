// Winston logger - extracted from lib_logging.js

export interface Logger {
  info(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
}

export function createLogger(label?: string): Logger {
  const prefix = label ? `[${label}]` : "";
  return {
    info: (message: string, ...meta: unknown[]) =>
      console.log(`${prefix} INFO:`, message, ...meta),
    warn: (message: string, ...meta: unknown[]) =>
      console.warn(`${prefix} WARN:`, message, ...meta),
    error: (message: string, ...meta: unknown[]) =>
      console.error(`${prefix} ERROR:`, message, ...meta),
    debug: (message: string, ...meta: unknown[]) => {
      if (process.env.DEBUG) {
        console.debug(`${prefix} DEBUG:`, message, ...meta);
      }
    },
  };
}

/** Default logger instance (fA) */
export const fA: Logger = createLogger("embedder");

export default fA;
