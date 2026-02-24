"use client";

import { useEffect, useState } from "react";

const readStoredValue = <T,>(key: string, initialValue: T): T => {
  if (typeof window === "undefined") return initialValue;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return initialValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return initialValue;
  }
};

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue));

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
