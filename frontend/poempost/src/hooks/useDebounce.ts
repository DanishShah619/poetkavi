import { useEffect, useState } from "react";

/**
 * Delays propagating `value` until it hasn't changed for `delay` ms.
 * Use this to avoid firing expensive operations (search queries, API calls)
 * on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
