"use client";

import { useEffect, useMemo, useState } from "react";

interface IceCracksProps {
  seed?: number;
  className?: string;
  aspect?: "wide" | "portrait";
  opacityBoost?: number;
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  opacity: number;
}

const COLOR_BRIGHT = "rgb(244, 252, 255)";

function seededRandom(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function addFracture(
  rng: () => number,
  segs: Segment[],
  sx: number,
  sy: number,
  angle: number,
  length: number,
  width: number,
  opacity: number,
  bounds: { min: number; max: number },
): void {
  const numSegments = 1 + Math.floor(rng() * 2);
  const segLen = length / numSegments;
  let x = sx;
  let y = sy;
  let a = angle;

  const addRidge = rng() < 0.3;
  const ridgeOffset = (0.8 + rng() * 0.7) * (rng() > 0.5 ? 1 : -1);

  for (let i = 0; i < numSegments; i++) {
    a += (rng() - 0.5) * 0.5;
    const x2 = x + Math.cos(a) * segLen;
    const y2 = y + Math.sin(a) * segLen;

    if (
      x2 < bounds.min ||
      x2 > bounds.max ||
      y2 < bounds.min ||
      y2 > bounds.max
    ) {
      return;
    }

    const progress = (i + 1) / numSegments;
    const segWidth = width * (1.05 - progress * 0.45);

    segs.push({ x1: x, y1: y, x2, y2, width: segWidth, opacity });

    if (addRidge) {
      const px = -Math.sin(a) * ridgeOffset;
      const py = Math.cos(a) * ridgeOffset;
      const rx1 = x + px;
      const ry1 = y + py;
      const rx2 = x2 + px;
      const ry2 = y2 + py;
      if (
        rx1 >= bounds.min &&
        rx1 <= bounds.max &&
        ry1 >= bounds.min &&
        ry1 <= bounds.max &&
        rx2 >= bounds.min &&
        rx2 <= bounds.max &&
        ry2 >= bounds.min &&
        ry2 <= bounds.max
      ) {
        segs.push({
          x1: rx1,
          y1: ry1,
          x2: rx2,
          y2: ry2,
          width: segWidth * 0.55,
          opacity: opacity * 0.55,
        });
      }
    }

    x = x2;
    y = y2;
  }

  if (length > 6 && rng() < 0.45) {
    const sign = rng() > 0.5 ? 1 : -1;
    const forkAngle = a + sign * (0.45 + rng() * 0.35);
    const forkLen = length * (0.35 + rng() * 0.25);
    const fx2 = x + Math.cos(forkAngle) * forkLen;
    const fy2 = y + Math.sin(forkAngle) * forkLen;
    if (
      fx2 >= bounds.min &&
      fx2 <= bounds.max &&
      fy2 >= bounds.min &&
      fy2 <= bounds.max
    ) {
      segs.push({
        x1: x,
        y1: y,
        x2: fx2,
        y2: fy2,
        width: width * 0.55,
        opacity: opacity * 0.8,
      });
    }
  }
}

function generateSegments(seed: number): Segment[] {
  const rng = seededRandom(seed);
  const segs: Segment[] = [];
  const bounds = { min: 2, max: 98 };

  const fractureCount = 12 + Math.floor(rng() * 7);
  for (let i = 0; i < fractureCount; i++) {
    const sx = bounds.min + rng() * (bounds.max - bounds.min);
    const sy = bounds.min + rng() * (bounds.max - bounds.min);
    const angle = rng() * Math.PI * 2;
    const length = 5 + rng() * 7;
    const width = 0.4 + rng() * 0.3;
    const opacity = 0.4 + rng() * 0.25;
    addFracture(rng, segs, sx, sy, angle, length, width, opacity, bounds);
  }

  const hairlineCount = 20 + Math.floor(rng() * 11);
  for (let i = 0; i < hairlineCount; i++) {
    const sx = bounds.min + rng() * (bounds.max - bounds.min);
    const sy = bounds.min + rng() * (bounds.max - bounds.min);
    const angle = rng() * Math.PI * 2;
    const len = 1.5 + rng() * 2.5;
    const x2 = sx + Math.cos(angle) * len;
    const y2 = sy + Math.sin(angle) * len;
    if (
      x2 < bounds.min ||
      x2 > bounds.max ||
      y2 < bounds.min ||
      y2 > bounds.max
    ) {
      continue;
    }
    segs.push({
      x1: sx,
      y1: sy,
      x2,
      y2,
      width: 0.2 + rng() * 0.15,
      opacity: 0.15 + rng() * 0.18,
    });
  }

  return segs;
}

export function IceCracks({
  seed,
  className,
  aspect = "wide",
  opacityBoost = 1,
}: IceCracksProps) {
  const [activeSeed, setActiveSeed] = useState<number | null>(null);

  useEffect(() => {
    // Avoid SSR/CSR mismatch from render-time Math.random().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveSeed(seed ?? Math.floor(Math.random() * 1_000_000));
  }, [seed]);

  const segments = useMemo(
    () => (activeSeed !== null ? generateSegments(activeSeed) : []),
    [activeSeed],
  );

  const preserve = aspect === "portrait" ? "xMidYMid slice" : "none";

  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
      style={{
        opacity: activeSeed !== null ? 1 : 0,
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio={preserve}
    >
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={COLOR_BRIGHT}
          strokeWidth={s.width}
          strokeOpacity={Math.min(1, s.opacity * opacityBoost)}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
