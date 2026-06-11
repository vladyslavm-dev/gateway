"use client";

import { useCallback, useSyncExternalStore } from "react";

function readMatch(query: string, fallback: boolean) {
  if (typeof window === "undefined" || !("matchMedia" in window)) {
    return fallback;
  }
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string, fallback = false) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined" || !("matchMedia" in window)) {
        return () => {};
      }

      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => readMatch(query, fallback),
    [query, fallback],
  );
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
