import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it has stopped changing for `delay` ms.
 * Keeps us from firing a request on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
