// Original: src/lib/serial/index.ts
// Re-exports for serial module
export { SerialPort } from "./SerialPort";
export { openPort, closePort, writePort, readPort } from "./ffi";
export { extractEmbeddedLibrary, getLibraryPath } from "./embeddedLibrary";
export { detectBaudRate, z4, commonBaudRates, type BaudDetectionResult } from "./baudDetection";
export { ZI, fg } from "./sharedSerialManager";
export { processSerialOutput, stripAnsiCodes } from "./textProcessing";
