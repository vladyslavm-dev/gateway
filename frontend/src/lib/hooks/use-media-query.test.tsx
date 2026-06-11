import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "@/lib/hooks/use-media-query";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("useMediaQuery", () => {
  it("updates from matchMedia change events and cleans up", () => {
    let matches = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const addEventListener = vi.fn((type: string, listener: EventListener) => {
      if (type === "change") {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    });
    const removeEventListener = vi.fn((type: string, listener: EventListener) => {
      if (type === "change") {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    });

    window.matchMedia = vi.fn(
      (query: string) =>
        ({
          media: query,
          get matches() {
            return matches;
          },
          addEventListener,
          removeEventListener,
        }) as unknown as MediaQueryList,
    );

    const { result, unmount } = renderHook(() =>
      useMediaQuery("(max-width: 640px)"),
    );

    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      for (const listener of listeners) {
        listener({ matches } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(listeners.size).toBe(0);
  });
});
