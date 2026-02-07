// Original: src/hooks/useMessageQueue.ts
// Message queue hook for ordered message processing
import { useState, useCallback } from "react";

export interface UseMessageQueueReturn<T = string> {
  enqueue: (item: T) => void;
  dequeue: () => T | undefined;
  peek: () => T | undefined;
  isEmpty: boolean;
}

export function useMessageQueue<T = string>(): UseMessageQueueReturn<T> {
  const [queue, setQueue] = useState<T[]>([]);

  const enqueue = useCallback((item: T) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const dequeue = useCallback((): T | undefined => {
    let item: T | undefined;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      item = prev[0];
      return prev.slice(1);
    });
    return item;
  }, []);

  const peek = useCallback((): T | undefined => {
    return queue[0];
  }, [queue]);

  return { enqueue, dequeue, peek, isEmpty: queue.length === 0 };
}
