import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { detectWebGL, useWebGLSupport } from "@/lib/hooks/use-webgl-support";

const originalCreateElement = document.createElement.bind(document);

afterEach(() => {
  document.createElement = originalCreateElement;
});

describe("webgl detection", () => {
  it("detectWebGL returns false when no GL context is available", () => {
    const noGlCanvas = {
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    document.createElement = vi.fn().mockReturnValue(noGlCanvas);
    expect(detectWebGL()).toBe(false);
  });

  it("detectWebGL returns true when a WebGL2 context is available", () => {
    const ctx = {
      getExtension: () => ({ loseContext: () => {} }),
    } as unknown as WebGL2RenderingContext;
    const glCanvas = {
      getContext: (type: string) => (type === "webgl2" ? ctx : null),
    } as unknown as HTMLCanvasElement;
    document.createElement = vi.fn().mockReturnValue(glCanvas);
    expect(detectWebGL()).toBe(true);
  });

  it("useWebGLSupport resolves to a boolean after mount (jsdom canvas returns null)", () => {
    const { result } = renderHook(() => useWebGLSupport());
    expect(typeof result.current).toBe("boolean");
  });
});
