import { useState, useEffect } from "react";

/**
 * Debounce hook — delays updating the value until after the specified delay.
 * Prevents excessive API calls during rapid user input (e.g., search).
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 400ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
