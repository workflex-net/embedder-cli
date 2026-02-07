// Original: src/lib/serial/ffi.ts
// FFI bindings for native serial port operations
import { getLibraryPath } from "./embeddedLibrary";

let nativeLib: Record<string, Function> | null = null;

function getNativeLib(): Record<string, Function> {
  if (!nativeLib) {
    const libPath = getLibraryPath();
    // TODO: restore FFI loading from bundled native library
    // nativeLib = dlopen(libPath, { ... });
    nativeLib = {};
  }
  return nativeLib;
}

export async function openPort(path: string, baudRate: number): Promise<number> {
  // TODO: restore from native FFI
  return -1;
}

export async function closePort(fd: number): Promise<void> {
  // TODO: restore from native FFI
}

export async function writePort(fd: number, data: Buffer): Promise<number> {
  // TODO: restore from native FFI
  return 0;
}

export async function readPort(fd: number, size: number): Promise<Buffer> {
  // TODO: restore from native FFI
  return Buffer.alloc(0);
}
