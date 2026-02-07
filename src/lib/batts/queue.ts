// Original: src/lib/batts/queue.ts
// Event queue for batching telemetry events

export class EventQueue<T = unknown> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  clear(): void {
    this.items = [];
  }

  get size(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  drain(): T[] {
    const drained = this.items;
    this.items = [];
    return drained;
  }
}
