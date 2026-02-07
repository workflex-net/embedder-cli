// Original: src/lib/serial/baudDetection.ts
// Baud rate auto-detection

export interface BaudDetectionResult {
  baudRate: number;
  confidence: number;
}

export const commonBaudRates: number[] = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
];

/**
 * Detect baud rate by sampling serial data at different rates.
 * Aliased as z4 in minified bundle.
 */
export async function detectBaudRate(portPath: string): Promise<BaudDetectionResult> {
  // TODO: restore from native implementation
  // Try each common baud rate and score based on readable character ratio
  return { baudRate: 115200, confidence: 0 };
}

/** Alias used in minified bundle */
export const z4 = detectBaudRate;
