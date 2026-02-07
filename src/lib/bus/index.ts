// Event bus for publish/subscribe messaging

type EventHandler<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe<T = unknown>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as EventHandler);
  }

  publish<T = unknown>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`EventBus error in handler for "${event}":`, err);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** Global event bus singleton (HG) */
export const HG = new EventBus();

export default HG;
