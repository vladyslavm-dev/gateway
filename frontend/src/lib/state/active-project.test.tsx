import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import {
  ActiveProjectProvider,
  useActiveProjectApi,
  useActiveProjectId,
} from "@/lib/state/active-project";

function wrap({ children }: { children: ReactNode }) {
  return <ActiveProjectProvider>{children}</ActiveProjectProvider>;
}

describe("active-project store", () => {
  it("returns null by default and can be updated via the api", () => {
    const { result } = renderHook(
      () => {
        const id = useActiveProjectId();
        const api = useActiveProjectApi();
        return { id, api };
      },
      { wrapper: wrap },
    );

    expect(result.current.id).toBeNull();

    act(() => result.current.api.set("vault"));
    expect(result.current.id).toBe("vault");

    act(() => result.current.api.set("auction"));
    expect(result.current.id).toBe("auction");

    act(() => result.current.api.clear());
    expect(result.current.id).toBeNull();
  });

  it("notifies subscribers exactly once per distinct change", () => {
    const { result } = renderHook(() => useActiveProjectApi(), { wrapper: wrap });

    const calls: Array<string | null> = [];
    const unsub = result.current.subscribe((v) => calls.push(v));

    act(() => result.current.set("vault"));
    act(() => result.current.set("vault"));
    act(() => result.current.set("auction"));
    act(() => result.current.clear());

    expect(calls).toEqual(["vault", "auction", null]);

    unsub();
    act(() => result.current.set("gateway"));
    expect(calls).toEqual(["vault", "auction", null]);
  });
});
