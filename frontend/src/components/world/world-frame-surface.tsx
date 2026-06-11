"use client";

import { useCallback, useEffect } from "react";

import {
  WaterPosterFallback,
  WaterWorld,
} from "@/components/world/water-world";
import { useWebGLSupport } from "@/lib/hooks/use-webgl-support";

export function WorldFrameSurface() {
  const webglSupported = useWebGLSupport();
  // Ready means the water shader has painted, not merely mounted.
  const handleReady = useCallback(() => {
    if (typeof window === "undefined") return;
    window.parent.postMessage(
      { type: "gateway:world-frame-ready" },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    if (webglSupported === false) {
      handleReady();
    }
  }, [handleReady, webglSupported]);

  return (
    <main aria-label="World frame" className="world-frame-root">
      {webglSupported === false ? (
        <WaterPosterFallback />
      ) : (
        <WaterWorld onReady={handleReady} />
      )}
    </main>
  );
}
