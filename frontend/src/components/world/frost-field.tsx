"use client";

import { useEffect, useRef } from "react";

import { useMediaQuery } from "@/lib/hooks/use-media-query";

interface FrostFieldProps {
  slabRefs: Array<React.RefObject<HTMLElement | null>>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  rot: number;
  spin: number;
}

const EDGE_PROXIMITY = 8;
const MAX_PARTICLES = 90;
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

export function FrostField({ slabRefs }: FrostFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canHover = useMediaQuery(HOVER_QUERY);

  useEffect(() => {
    if (!canHover) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    const cursor = { x: -1000, y: -1000 };
    const viewport = { w: 0, h: 0 };
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewport.w = document.documentElement.clientWidth;
      viewport.h = window.innerHeight;
      canvas.width = viewport.w * dpr;
      canvas.height = viewport.h * dpr;
      canvas.style.width = `${viewport.w}px`;
      canvas.style.height = `${viewport.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (event: MouseEvent) => {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const computeEdgeContact = (rect: DOMRect, cx: number, cy: number) => {
      const insideX = cx >= rect.left && cx <= rect.right;
      const insideY = cy >= rect.top && cy <= rect.bottom;

      if (insideX && insideY) {
        const dLeft = cx - rect.left;
        const dRight = rect.right - cx;
        const dTop = cy - rect.top;
        const dBottom = rect.bottom - cy;
        const minH = Math.min(dLeft, dRight);
        const minV = Math.min(dTop, dBottom);
        if (minH < minV) {
          return {
            edgeX: dLeft < dRight ? rect.left : rect.right,
            edgeY: cy,
            edgeDist: minH,
            normalX: dLeft < dRight ? -1 : 1,
            normalY: 0,
          };
        }
        return {
          edgeX: cx,
          edgeY: dTop < dBottom ? rect.top : rect.bottom,
          edgeDist: minV,
          normalX: 0,
          normalY: dTop < dBottom ? -1 : 1,
        };
      }

      const ex = Math.max(rect.left, Math.min(cx, rect.right));
      const ey = Math.max(rect.top, Math.min(cy, rect.bottom));
      const dx = cx - ex;
      const dy = cy - ey;
      const d = Math.hypot(dx, dy);
      const nx = d > 0 ? dx / d : 0;
      const ny = d > 0 ? dy / d : -1;
      return { edgeX: ex, edgeY: ey, edgeDist: d, normalX: nx, normalY: ny };
    };

    const spawn = () => {
      if (particles.length >= MAX_PARTICLES) return;
      if (cursor.x < 0) return;

      let closest:
        | {
            contact: ReturnType<typeof computeEdgeContact>;
            dist: number;
          }
        | null = null;

      slabRefs.forEach((ref) => {
        const el = ref.current;
        if (!el) return;
        if (el.getAttribute("aria-hidden") === "true") return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;

        const contact = computeEdgeContact(rect, cursor.x, cursor.y);
        if (contact.edgeDist > EDGE_PROXIMITY) return;
        if (!closest || contact.edgeDist < closest.dist) {
          closest = { contact, dist: contact.edgeDist };
        }
      });

      if (!closest) return;
      const c: { contact: ReturnType<typeof computeEdgeContact>; dist: number } =
        closest;
      const intensity = 1 - c.dist / EDGE_PROXIMITY;
      if (Math.random() > 0.35 + intensity * 0.55) return;

      const tangentX = -c.contact.normalY;
      const tangentY = c.contact.normalX;
      const offsetT = (Math.random() - 0.5) * 36;
      const baseX = c.contact.edgeX + tangentX * offsetT;
      const baseY = c.contact.edgeY + tangentY * offsetT;

      const speed = 0.3 + Math.random() * 0.7;
      const spread = (Math.random() - 0.5) * 0.85;
      const vx =
        c.contact.normalX * speed + tangentX * spread * speed * 0.7;
      const vy =
        c.contact.normalY * speed +
        tangentY * spread * speed * 0.7 -
        0.1 -
        Math.random() * 0.18;

      particles.push({
        x: baseX,
        y: baseY,
        vx,
        vy,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        size: 1.0 + Math.random() * 1.4,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.05,
      });
    };

    const drawCrystal = (
      x: number,
      y: number,
      size: number,
      rot: number,
      alpha: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(244, 252, 255, 1)";
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.42, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.42, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, viewport.w, viewport.h);
      spawn();

      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.003;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.rot += p.spin;
        p.life -= p.decay;
        if (p.life <= 0) return false;
        const lifeAlpha = Math.min(1, p.life * 1.8) * 0.65;
        drawCrystal(p.x, p.y, p.size * (0.65 + 0.35 * p.life), p.rot, lifeAlpha);
        return true;
      });
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [canHover, slabRefs]);

  if (!canHover) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
