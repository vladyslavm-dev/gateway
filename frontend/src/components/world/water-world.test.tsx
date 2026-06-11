import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { WaterPosterFallback, WaterWorld } from "@/components/world/water-world";

const mockCanvasState = vi.hoisted(() => ({
  canvases: [] as HTMLCanvasElement[],
  readyCallbacks: [] as Array<() => void>,
  setClearColor: vi.fn(),
}));

vi.mock("@react-three/fiber", () => ({
  Canvas: ({
    children,
    onCreated,
  }: {
    children?: React.ReactNode;
    onCreated?: (args: { gl: unknown }) => void;
  }) => {
    const createdRef = React.useRef(false);
    if (!createdRef.current) {
      createdRef.current = true;
      const canvas = document.createElement("canvas");
      mockCanvasState.canvases.push(canvas);
      const child = React.Children.toArray(children).find(
        (item): item is React.ReactElement<{ onReady?: () => void }> =>
          React.isValidElement<{ onReady?: () => void }>(item) &&
          typeof item.props.onReady === "function",
      );
      const ready = child?.props.onReady;
      if (typeof ready === "function") {
        mockCanvasState.readyCallbacks.push(ready);
      }
      onCreated?.({
        gl: {
          domElement: canvas,
          setClearColor: mockCanvasState.setClearColor,
        },
      });
    }
    return <div data-testid="mock-water-canvas" />;
  },
  createPortal: (node: React.ReactNode) => node,
  useFrame: vi.fn(),
  useThree: vi.fn(),
}));

vi.mock("@react-three/drei", () => ({
  useFBO: vi.fn(),
}));

describe("WaterWorld", () => {
  it("prevents terminal WebGL loss and remounts after restoration", async () => {
    mockCanvasState.canvases = [];
    mockCanvasState.readyCallbacks = [];

    const { container } = render(<WaterWorld />);
    const canvas = mockCanvasState.canvases[0];
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    const lost = new Event("webglcontextlost", { cancelable: true });
    act(() => {
      canvas.dispatchEvent(lost);
    });

    expect(lost.defaultPrevented).toBe(true);
    expect(container.querySelector(".water-poster-fallback")).not.toBeNull();

    act(() => {
      canvas.dispatchEvent(new Event("webglcontextrestored"));
    });

    await waitFor(() => {
      expect(mockCanvasState.canvases).toHaveLength(2);
    });
    expect(container.querySelector(".water-poster-fallback")).not.toBeNull();

    act(() => {
      mockCanvasState.readyCallbacks.at(-1)?.();
    });

    await waitFor(() => {
      expect(container.querySelector(".water-poster-fallback")).toBeNull();
    });
  });

  it("renders the static poster fallback with the shared water asset", () => {
    const { container } = render(<WaterPosterFallback />);
    expect(container.querySelector(".water-poster-fallback")).not.toBeNull();
  });
});
