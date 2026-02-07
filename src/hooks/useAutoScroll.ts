// Original: src/hooks/useAutoScroll.ts
// Auto-scroll hook for chat/terminal containers
import { useState, useCallback, useEffect, type RefObject } from "react";

export interface UseAutoScrollOptions {
  containerRef: RefObject<HTMLElement | null>;
  dependencies: unknown[];
}

export interface UseAutoScrollReturn {
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

export function useAutoScroll({ containerRef, dependencies }: UseAutoScrollOptions): UseAutoScrollReturn {
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setIsAtBottom(true);
    }
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 20;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setIsAtBottom(atBottom);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { isAtBottom, scrollToBottom };
}
