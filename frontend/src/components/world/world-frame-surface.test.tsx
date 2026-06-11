import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldFrameSurface } from "@/components/world/world-frame-surface";

const mockWebGLState = vi.hoisted(() => ({
  supported: true as boolean | null,
}));

vi.mock("@/lib/hooks/use-webgl-support", () => ({
  useWebGLSupport: () => mockWebGLState.supported,
}));

vi.mock("@/components/world/water-world", () => ({
  WaterPosterFallback: () => <div data-testid="water-poster-fallback" />,
  WaterWorld: () => <div data-testid="water-world" />,
}));

describe("WorldFrameSurface", () => {
  beforeEach(() => {
    mockWebGLState.supported = true;
    vi.restoreAllMocks();
  });

  it("renders the canvas path when WebGL is available", () => {
    render(<WorldFrameSurface />);

    expect(screen.getByTestId("water-world")).toBeInTheDocument();
    expect(screen.queryByTestId("water-poster-fallback")).not.toBeInTheDocument();
  });

  it("uses the poster path and reports ready when WebGL is unavailable", async () => {
    mockWebGLState.supported = false;
    const postMessageSpy = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => {});

    render(<WorldFrameSurface />);

    expect(screen.getByTestId("water-poster-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("water-world")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(postMessageSpy).toHaveBeenCalledWith(
        { type: "gateway:world-frame-ready" },
        window.location.origin,
      );
    });
  });
});
