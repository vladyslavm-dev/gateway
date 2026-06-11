"use client";

import { Lifebuoy } from "@/components/world/lifebuoy";

interface LoadingScrimProps {
  visible: boolean;
}

// Visible until WaterWorld reports a textured first frame.
export function LoadingScrim({ visible }: LoadingScrimProps) {
  return (
    <div
      aria-hidden={!visible}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        backgroundColor: "#2eb4c0",
        backgroundImage: "url(/stage/world/water-scrim.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "grid",
        placeItems: "center",
        willChange: "opacity",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(8px) saturate(108%)",
          WebkitBackdropFilter: "blur(8px) saturate(108%)",
          backgroundColor: "rgba(46, 180, 192, 0.18)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Lifebuoy size={56} />
      </div>
    </div>
  );
}
