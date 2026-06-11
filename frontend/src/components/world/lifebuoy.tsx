"use client";

// SVG path adapted from Phosphor Icons `lifebuoy` (MIT).
// Full license text: /THIRD_PARTY_LICENSES.md.

import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";

const PHOSPHOR_PATH =
  "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm39.1,131.79a47.84,47.84,0,0,0,0-55.58l28.5-28.49a87.83,87.83,0,0,1,0,112.56ZM96,128a32,32,0,1,1,32,32A32,32,0,0,1,96,128Zm88.28-67.6L155.79,88.9a47.84,47.84,0,0,0-55.58,0L71.72,60.4a87.83,87.83,0,0,1,112.56,0ZM60.4,71.72l28.5,28.49a47.84,47.84,0,0,0,0,55.58L60.4,184.28a87.83,87.83,0,0,1,0-112.56ZM71.72,195.6l28.49-28.5a47.84,47.84,0,0,0,55.58,0l28.49,28.5a87.83,87.83,0,0,1-112.56,0Z";

const COLOR_RING = "#ffffff";
const COLOR_AMBER = "#ffaa66";
const COLOR_AMBER_DEEP = "#e89050";

const SPARK_INTERVAL_MS = 120;
const SPARK_DURATION = 0.52;

interface LifebuoyProps {
  size?: number;
}

export function Lifebuoy({ size = 56 }: LifebuoyProps) {
  const rotateRef = useRef<SVGGElement | null>(null);
  const sparkHostRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const tweens: gsap.core.Tween[] = [];

    if (rotateRef.current) {
      gsap.set(rotateRef.current, {
        svgOrigin: "128 128",
      });
      tweens.push(
        gsap.to(rotateRef.current, {
          rotation: 360,
          duration: 0.25,
          ease: "none",
          repeat: -1,
          svgOrigin: "128 128",
        }),
      );
    }
    const host = sparkHostRef.current;
    let intervalId: number | null = null;
    if (host) {
      const spawnSpark = () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = size * 0.48;
        const startX = size / 2 + Math.cos(angle) * radius;
        const startY = size / 2 + Math.sin(angle) * radius;
        const tangentX = -Math.sin(angle);
        const tangentY = Math.cos(angle);
        const radialX = Math.cos(angle);
        const radialY = Math.sin(angle);
        const drift = 14 + Math.random() * 10;
        const dx = tangentX * drift + radialX * drift * 0.35;
        const dy = tangentY * drift + radialY * drift * 0.35;

        const spark = document.createElement("span");
        spark.style.position = "absolute";
        spark.style.left = `${startX}px`;
        spark.style.top = `${startY}px`;
        spark.style.width = "3px";
        spark.style.height = "3px";
        spark.style.marginLeft = "-1.5px";
        spark.style.marginTop = "-1.5px";
        spark.style.borderRadius = "50%";
        spark.style.background = "#ffffff";
        spark.style.boxShadow =
          "0 0 6px rgba(255, 220, 180, 0.95), 0 0 2px rgba(255, 255, 255, 1)";
        spark.style.pointerEvents = "none";
        spark.style.opacity = "0";
        host.appendChild(spark);

        gsap
          .timeline({ onComplete: () => spark.remove() })
          .to(spark, {
            opacity: 1,
            duration: 0.06,
            ease: "power2.out",
          })
          .to(
            spark,
            {
              x: dx,
              y: dy,
              opacity: 0,
              scale: 0.4,
              duration: SPARK_DURATION,
              ease: "power2.out",
            },
            0,
          );
      };
      intervalId = window.setInterval(spawnSpark, SPARK_INTERVAL_MS);
    }

    return () => {
      tweens.forEach((t) => t.kill());
      if (intervalId !== null) window.clearInterval(intervalId);
      if (host) {
        host.replaceChildren();
      }
    };
  }, [size]);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        filter:
          "drop-shadow(0 8px 24px rgba(15, 50, 70, 0.45)) drop-shadow(0 0 18px rgba(255, 200, 140, 0.35))",
      }}
    >
      <svg
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
        aria-hidden
      >
        <g ref={rotateRef}>
          <defs>
            <radialGradient id="lifebuoy-amber" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={COLOR_AMBER} />
              <stop offset="100%" stopColor={COLOR_AMBER_DEEP} />
            </radialGradient>
            <radialGradient id="lifebuoy-ring" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0eef5" />
            </radialGradient>
          </defs>
          <circle
            cx="128"
            cy="128"
            r="104"
            fill="url(#lifebuoy-amber)"
          />
          <circle
            cx="128"
            cy="128"
            r="32"
            fill="rgba(20, 60, 80, 0.55)"
          />
          <path
            d={PHOSPHOR_PATH}
            fill="url(#lifebuoy-ring)"
            fillRule="evenodd"
            stroke={COLOR_RING}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      <div
        ref={sparkHostRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      />
    </div>
  );
}
