"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(key);
    if (stored === null) return;
    try {
      setValue(JSON.parse(stored) as T);
    } catch {
      setValue(initialValue);
    }
  }, [initialValue, key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
