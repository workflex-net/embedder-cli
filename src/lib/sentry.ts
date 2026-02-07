// Sentry error tracking - extracted from lib_sentry.js

let initialized = false;

export function initSentry(dsn?: string): void {
  if (dsn) {
    initialized = true;
  }
}

/** Capture exception (cO) */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;
  console.error("[Sentry]", error.message, context);
}
export const cO = captureException;

/** Set user context (w8) */
export function setUser(user: { id: string; email?: string } | null): void {
  if (!initialized) return;
}
export const w8 = setUser;

/** Set tag (TI) */
export function setTag(key: string, value: string): void {
  if (!initialized) return;
}
export const TI = setTag;

/** Add breadcrumb (vZ) */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: string;
}): void {
  if (!initialized) return;
}
export const vZ = addBreadcrumb;

export default { initSentry, captureException, setUser, setTag, addBreadcrumb };
