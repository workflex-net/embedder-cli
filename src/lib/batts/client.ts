// Original: src/lib/batts/client.ts
// Extracted: lib_telemetry.js
// Telemetry client for usage tracking

import { EventQueue } from "./queue";

export interface TelemetryEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

export class TelemetryClient {
  private queue: EventQueue;
  private authTokenGetter: (() => Promise<string>) | null = null;

  constructor() {
    this.queue = new EventQueue();
  }

  track(eventName: string, properties: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };
    this.queue.enqueue(event);
  }

  session(sessionId: string): void {
    this.track("session_start", { sessionId });
  }

  async flush(): Promise<void> {
    // TODO: restore from lib_telemetry.js - send queued events to backend
    this.queue.clear();
  }

  setAuthTokenGetter(getter: () => Promise<string>): void {
    this.authTokenGetter = getter;
  }
}

/** Singleton telemetry client - aliased as eg in minified bundle */
export const eg = new TelemetryClient();
