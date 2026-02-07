// Original: src/lib/serial/SerialPort.ts
// SerialPort class wrapping native FFI bindings
import { openPort, closePort, writePort, readPort } from "./ffi";

export interface SerialPortOptions {
  path: string;
  baudRate: number;
}

export class SerialPort {
  private fd: number | null = null;
  private _path: string;
  private _baudRate: number;
  private _isOpen = false;

  constructor(options: SerialPortOptions) {
    this._path = options.path;
    this._baudRate = options.baudRate;
  }

  get path(): string {
    return this._path;
  }

  get baudRate(): number {
    return this._baudRate;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  async open(): Promise<void> {
    this.fd = await openPort(this._path, this._baudRate);
    this._isOpen = true;
  }

  async close(): Promise<void> {
    if (this.fd !== null) {
      await closePort(this.fd);
      this.fd = null;
      this._isOpen = false;
    }
  }

  async write(data: Buffer | string): Promise<number> {
    if (this.fd === null) throw new Error("Port is not open");
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    return writePort(this.fd, buf);
  }

  async read(size: number): Promise<Buffer> {
    if (this.fd === null) throw new Error("Port is not open");
    return readPort(this.fd, size);
  }
}
