"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

import type { GraphDustSnapshot } from "@/components/projects/projects-graph-island";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

interface DustFieldProps {
  slabRef: RefObject<HTMLElement | null>;
  snapshotRef: MutableRefObject<GraphDustSnapshot | null>;
  density?: number;
  palette?: string[];
  trails?: boolean;
}

const FROST_PALETTE = [
  "rgba(207, 238, 250, ",
  "rgba(179, 229, 241, ",
  "rgba(163, 227, 237, ",
  "rgba(223, 248, 252, ",
];

interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  colorIdx: number;
  life: number;
  isTrail: boolean;
}

interface NodeTrack {
  prevX: number;
  prevY: number;
  vMag: number;
  wakeX: number;
  wakeY: number;
  wakeTTL: number;
}

const NODE_MASS_RADIUS = 3.2;
const LINK_INFLUENCE_PX = 18;
const DAMPING_BASE = 0.985;
const DAMPING_RELEASE = 0.92;
const WAKE_PULL = 0.05;
const WAKE_TTL_MS = 1000;
const WAKE_REACH_PX = 90;
const LINK_DISPERSE_SCALE = 0.22;
const TRAIL_EMIT_SPEED = 3;
const TRAIL_LIFE_MS = 320;
const TRAIL_EMIT_PROB = 0.48;
const DUST_LINK_DIST = 110;
const DUST_LINK_OPACITY = 0.28;
const DELTA_REF_MS = 16.67;

export function DustField({
  slabRef,
  snapshotRef,
  density = 175,
  palette = FROST_PALETTE,
  trails = true,
}: DustFieldProps) {
  const isMobileDust = useMediaQuery("(max-width: 768px)");
  const effectiveDensity = isMobileDust ? Math.round(density / 2) : density;
  const effectiveTrails = trails && !isMobileDust;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const slab = slabRef.current;
    if (!canvas || !slab) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    let raf = 0;
    let lastTickMs = performance.now();
    const nodeTracks = new Map<string, NodeTrack>();
    const maxDust = effectiveDensity * 2;
    let dust: Dust[] = [];

    const resize = () => {
      const rect = slab.getBoundingClientRect();
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(slab);

    for (let i = 0; i < effectiveDensity; i++) {
      dust.push({
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size: 1 + Math.random() * 1.4,
        opacity: 0.45 + Math.random() * 0.4,
        colorIdx: Math.floor(Math.random() * palette.length),
        life: 1,
        isTrail: false,
      });
    }

    const tick = (now: number) => {
      const deltaMs = Math.min(now - lastTickMs, 48);
      lastTickMs = now;
      const dScale = deltaMs / DELTA_REF_MS;
      const damp = Math.pow(DAMPING_BASE, dScale);
      const dampRelease = Math.pow(DAMPING_RELEASE, dScale);

      const snap = snapshotRef.current;
      const xScale = snap && snap.width > 0 ? cssW / snap.width : 1;
      const yScale = snap && snap.height > 0 ? cssH / snap.height : 1;
      const radiusScale = Math.min(xScale, yScale);

      // Keep expanded graphs from injecting proportionally more dust.
      let skillCount = 0;
      if (snap) {
        for (const n of snap.nodes) if (n.kind === "skill") skillCount += 1;
      }
      const densityScale =
        skillCount <= 3 ? 1 : Math.min(1, 3 / skillCount);

      const seen = new Set<string>();
      if (snap) {
        for (const n of snap.nodes) {
          seen.add(n.id);
          const px = n.x * xScale;
          const py = n.y * yScale;
          const pvx = n.vx * xScale;
          const pvy = n.vy * yScale;
          const mag = Math.hypot(pvx, pvy);
          const track = nodeTracks.get(n.id);
          if (!track) {
            nodeTracks.set(n.id, {
              prevX: px,
              prevY: py,
              vMag: mag,
              wakeX: px,
              wakeY: py,
              wakeTTL: 0,
            });
          } else {
            track.wakeX = track.prevX;
            track.wakeY = track.prevY;
            track.prevX = px;
            track.prevY = py;
            track.vMag = track.vMag * 0.72 + mag * 0.28;
            if (track.wakeTTL > 0) {
              track.wakeTTL = Math.max(0, track.wakeTTL - deltaMs);
            }
          }
        }
      }
      for (const [id, track] of nodeTracks) {
        if (!seen.has(id)) {
          if (track.wakeTTL <= 0) track.wakeTTL = WAKE_TTL_MS;
          else track.wakeTTL = Math.max(0, track.wakeTTL - deltaMs);
          if (track.wakeTTL <= 0) nodeTracks.delete(id);
        }
      }

      for (const p of dust) {
        let damping = damp;

        if (snap) {
          for (const n of snap.nodes) {
            const nx = n.x * xScale;
            const ny = n.y * yScale;
            const influenceR = n.radius * radiusScale * NODE_MASS_RADIUS;
            if (influenceR <= 0) continue;
            const dx = p.x - nx;
            const dy = p.y - ny;
            if (Math.abs(dx) > influenceR || Math.abs(dy) > influenceR)
              continue;
            const dist = Math.hypot(dx, dy);
            if (dist >= influenceR) continue;
            const ratio = dist / influenceR;
            const falloff = 1 - ratio * ratio * ratio;
            const track = nodeTracks.get(n.id);
            const nvx = n.vx * xScale;
            const nvy = n.vy * yScale;
            p.vx += nvx * falloff * dScale * 0.55 * densityScale;
            p.vy += nvy * falloff * dScale * 0.55 * densityScale;
            if (track && track.vMag < 0.3) {
              damping = Math.min(damping, dampRelease);
            }
          }

          for (const l of snap.links) {
            const sx = l.sx * xScale;
            const sy = l.sy * yScale;
            const tx = l.tx * xScale;
            const ty = l.ty * yScale;
            const segDX = tx - sx;
            const segDY = ty - sy;
            const segLenSq = segDX * segDX + segDY * segDY;
            if (segLenSq < 1) continue;
            const t = Math.max(
              0,
              Math.min(
                1,
                ((p.x - sx) * segDX + (p.y - sy) * segDY) / segLenSq,
              ),
            );
            const cx = sx + t * segDX;
            const cy = sy + t * segDY;
            const dx = p.x - cx;
            const dy = p.y - cy;
            if (
              Math.abs(dx) > LINK_INFLUENCE_PX ||
              Math.abs(dy) > LINK_INFLUENCE_PX
            )
              continue;
            const dist = Math.hypot(dx, dy);
            if (dist >= LINK_INFLUENCE_PX || dist < 0.01) continue;
            const f = 1 - dist / LINK_INFLUENCE_PX;
            p.vx += (dx / dist) * f * LINK_DISPERSE_SCALE * dScale;
            p.vy += (dy / dist) * f * LINK_DISPERSE_SCALE * dScale;
          }
        }

        for (const track of nodeTracks.values()) {
          if (track.wakeTTL <= 0) continue;
          const dx = track.wakeX - p.x;
          const dy = track.wakeY - p.y;
          if (Math.abs(dx) > WAKE_REACH_PX || Math.abs(dy) > WAKE_REACH_PX)
            continue;
          const dist = Math.hypot(dx, dy);
          if (dist < 1 || dist > WAKE_REACH_PX) continue;
          const intensity = (track.wakeTTL / WAKE_TTL_MS) * WAKE_PULL;
          p.vx += (dx / dist) * intensity * dScale;
          p.vy += (dy / dist) * intensity * dScale;
        }

        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx * dScale;
        p.y += p.vy * dScale;

        // Corner nudge prevents particle pileups.
        const CORNER_KICK = 0.08;
        let hitX = false;
        let hitY = false;
        if (p.x < 0) {
          p.x = 0;
          p.vx = -p.vx * 0.5;
          hitX = true;
        } else if (p.x > cssW) {
          p.x = cssW;
          p.vx = -p.vx * 0.5;
          hitX = true;
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy = -p.vy * 0.5;
          hitY = true;
        } else if (p.y > cssH) {
          p.y = cssH;
          p.vy = -p.vy * 0.5;
          hitY = true;
        }
        if (hitX) p.vy += (Math.random() - 0.5) * CORNER_KICK;
        if (hitY) p.vx += (Math.random() - 0.5) * CORNER_KICK;

        if (p.isTrail) {
          p.life -= deltaMs / TRAIL_LIFE_MS;
        }
      }

      if (dust.length > maxDust * 1.1) {
        dust = dust.filter((p) => !p.isTrail || p.life > 0);
      } else {
        let write = 0;
        for (let i = 0; i < dust.length; i++) {
          const p = dust[i];
          if (p.isTrail && p.life <= 0) continue;
          if (write !== i) dust[write] = p;
          write++;
        }
        dust.length = write;
      }

      if (effectiveTrails && snap && dust.length < maxDust) {
        for (const n of snap.nodes) {
          const track = nodeTracks.get(n.id);
          if (!track) continue;
          if (track.vMag < TRAIL_EMIT_SPEED) continue;
          if (Math.random() > TRAIL_EMIT_PROB * densityScale) continue;
          if (dust.length >= maxDust) break;
          const jitter = n.radius * radiusScale * 0.55;
          dust.push({
            x: n.x * xScale + (Math.random() - 0.5) * jitter,
            y: n.y * yScale + (Math.random() - 0.5) * jitter,
            vx: n.vx * xScale * 0.22 + (Math.random() - 0.5) * 0.18,
            vy: n.vy * yScale * 0.22 + (Math.random() - 0.5) * 0.18,
            size: 0.9 + Math.random() * 0.8,
            opacity: 0.55,
            colorIdx: Math.floor(Math.random() * palette.length),
            life: 1,
            isTrail: true,
          });
        }
      }

      ctx.clearRect(0, 0, cssW, cssH);

      ctx.strokeStyle = `${palette[0]}${DUST_LINK_OPACITY})`;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < dust.length; i++) {
        const a = dust[i];
        for (let j = i + 1; j < dust.length; j++) {
          const b = dust[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) > DUST_LINK_DIST || Math.abs(dy) > DUST_LINK_DIST)
            continue;
          const dist = Math.hypot(dx, dy);
          if (dist > DUST_LINK_DIST) continue;
          const alpha = (1 - dist / DUST_LINK_DIST) * DUST_LINK_OPACITY;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      for (const p of dust) {
        const alpha = p.isTrail
          ? p.opacity * Math.max(0, p.life)
          : p.opacity;
        ctx.fillStyle = `${palette[p.colorIdx]}${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [slabRef, snapshotRef, effectiveDensity, effectiveTrails, palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
