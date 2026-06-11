"use client";

import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerScroll(): void {
  if (registered || typeof window === "undefined") {
    return;
  }
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  gsap.ticker.lagSmoothing(1000, 16);
  registered = true;
}

export function refreshScroll(): void {
  if (typeof window === "undefined") {
    return;
  }
  ScrollTrigger.refresh();
}

export const EASE = {
  spring: "power3.out",
  springSoft: "power2.out",
  bounce: "bounce.out",
  elastic: "elastic.out(1, 0.5)",
  authored: "expo.out",
} as const;

export const DURATION = {
  micro: 0.18,
  quick: 0.25,
  standard: 0.6,
  slow: 1.1,
} as const;

export { gsap, ScrollTrigger };
