import { useCallback, useEffect, useRef, useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const initialRef = useRef(initial);

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialRef.current;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initialRef.current;
      return JSON.parse(raw) as T;
    } catch {
      return initialRef.current;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / serialization errors */
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof next === 'function' ? (next as (p: T) => T)(prev) : next
    );
  }, []);

  return [value, set];
}
