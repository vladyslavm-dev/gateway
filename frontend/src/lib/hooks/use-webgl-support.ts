"use client";

import { useState } from "react";

export function detectWebGL(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!ctx) {
      return false;
    }
    const loseCtx = ctx.getExtension("WEBGL_lose_context");
    loseCtx?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function useWebGLSupport(): boolean | null {
  const [supported] = useState<boolean | null>(() =>
    typeof window === "undefined" ? null : detectWebGL(),
  );
  return supported;
}
