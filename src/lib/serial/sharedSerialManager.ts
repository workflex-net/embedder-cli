// Original: src/lib/serial/sharedSerialManager.ts
// Shared serial manager singleton
import { SerialPort } from "./SerialPort";

export type SerialDataCallback = (data: Buffer) => void;

interface SerialConnection {
  port: SerialPort;
  subscribers: Map<string, SerialDataCallback>;
}

class SharedSerialManager {
  private connections: Map<string, SerialConnection> = new Map();

  subscribe(portPath: string, id: string, callback: SerialDataCallback): void {
    const conn = this.connections.get(portPath);
    if (conn) {
      conn.subscribers.set(id, callback);
    }
  }

  unsubscribe(portPath: string, id: string): void {
    const conn = this.connections.get(portPath);
    if (conn) {
      conn.subscribers.delete(id);
    }
  }

  async write(portPath: string, data: string | Buffer): Promise<void> {
    const conn = this.connections.get(portPath);
    if (conn && conn.port.isOpen) {
      await conn.port.write(data);
    }
  }

  isConnected(portPath: string): boolean {
    const conn = this.connections.get(portPath);
    return conn?.port.isOpen ?? false;
  }

  getBaudRate(portPath: string): number | null {
    const conn = this.connections.get(portPath);
    return conn?.port.baudRate ?? null;
  }
}

/** Singleton instance - aliased as ZI in minified bundle */
export const ZI = new SharedSerialManager();

/** Serial store - aliased as fg in minified bundle */
export const fg = {
  manager: ZI,
};
