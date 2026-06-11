import type { CSSProperties } from "react";

// Liquid glass: one backdrop-filter owner per visible surface.
export const ICE_GLASS_STYLE: CSSProperties = {
  background: [
    "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.10) 45%, transparent 80%)",
    "radial-gradient(circle 45% 65% at 0% 0%, rgba(255, 255, 255, 0.22) 0%, transparent 75%)",
    "radial-gradient(circle 45% 65% at 100% 0%, rgba(255, 255, 255, 0.22) 0%, transparent 75%)",
    "linear-gradient(180deg, rgba(244, 250, 254, 0.30) 0%, rgba(220, 240, 248, 0.20) 55%, rgba(200, 232, 242, 0.16) 100%)",
  ].join(", "),
  border: "1px solid rgba(232, 246, 252, 0.42)",
  boxShadow:
    "0 18px 32px rgba(40, 90, 110, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.62), inset 0 -1px 0 rgba(120, 180, 200, 0.16)",
  backdropFilter: "blur(8px) saturate(112%)",
  WebkitBackdropFilter: "blur(8px) saturate(112%)",
  borderRadius: "1.75rem",
  overflow: "hidden",
  position: "relative",
};

// Inner controls stay solid so filters do not stack.
export const FROSTED_PANEL_STYLE: CSSProperties = {
  background: [
    "linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(248, 252, 255, 0.66) 100%)",
    "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(255, 255, 255, 0.22) 0%, transparent 85%)",
  ].join(", "),
  border: "1px solid rgba(220, 234, 244, 0.7)",
  boxShadow:
    "0 6px 14px rgba(40, 90, 110, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 0 rgba(120, 180, 200, 0.10)",
  borderRadius: "1.25rem",
  position: "relative",
};

export const FROSTED_PILL_STYLE: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.82) 0%, rgba(244, 250, 254, 0.70) 100%)",
  border: "1px solid rgba(220, 234, 244, 0.78)",
  boxShadow:
    "0 3px 8px rgba(20, 50, 70, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 0 rgba(120, 180, 200, 0.14)",
  borderRadius: "9999px",
  position: "relative",
};
