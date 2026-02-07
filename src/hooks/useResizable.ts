// Original: src/hooks/useResizable.ts
// Resizable panel hook
import { useState, useCallback, useEffect, useRef } from "react";

export interface UseResizableOptions {
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
}

export interface UseResizableReturn {
  width: number;
  isDragging: boolean;
  handleMouseDown: (event: React.MouseEvent) => void;
}

export function useResizable({ minWidth, maxWidth, defaultWidth }: UseResizableOptions): UseResizableReturn {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      setIsDragging(true);
      startXRef.current = event.clientX;
      startWidthRef.current = width;
      event.preventDefault();
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const delta = event.clientX - startXRef.current;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth]);

  return { width, isDragging, handleMouseDown };
}
