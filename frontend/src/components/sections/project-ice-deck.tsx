"use client";

import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  ProjectIceCard,
  type ProjectIceCardHandle,
} from "@/components/projects/project-ice-card";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useActiveProjectApi } from "@/lib/state/active-project";
import type {
  LocaleDictionary,
  ProjectContent,
} from "@/lib/site-config.types";

interface ProjectIceDeckProps {
  dictionary: LocaleDictionary;
  projects: ProjectContent[];
}

interface Slot {
  x: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

const PEEK_RATIO = 0.22;
const OFFSTAGE_RATIO = 0.36;
const DECK_TWEEN_MS = 450;
const DECK_GRAPH_SYNC_DELAY_MS = DECK_TWEEN_MS + 20;

function buildSlotMap(stageWidth: number): Record<number, Slot> {
  const peek = stageWidth * PEEK_RATIO;
  const offstage = stageWidth * OFFSTAGE_RATIO;
  return {
    0: { x: 0, scale: 1.0, opacity: 1.0, zIndex: 30 },
    [-1]: { x: -peek, scale: 0.82, opacity: 0.55, zIndex: 20 },
    1: { x: peek, scale: 0.82, opacity: 0.55, zIndex: 20 },
    [-2]: { x: -offstage, scale: 0.7, opacity: 0.0, zIndex: 10 },
    2: { x: offstage, scale: 0.7, opacity: 0.0, zIndex: 10 },
  };
}

const DEFAULT_SLOT_MAP = buildSlotMap(1056);

function signedOffset(focalIndex: number, target: number, total: number) {
  const raw = target - focalIndex;
  const half = total / 2;
  if (raw > half) return raw - total;
  if (raw < -half) return raw + total;
  return raw;
}

export function ProjectIceDeck({ dictionary, projects }: ProjectIceDeckProps) {
  const total = projects.length;
  const [focalIndex, setFocalIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slotMap, setSlotMap] =
    useState<Record<number, Slot>>(DEFAULT_SLOT_MAP);
  const isMobileDeck = useMediaQuery("(max-width: 640px)");
  const activeApi = useActiveProjectApi();

  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const sizerRef = useRef<HTMLDivElement | null>(null);
  const cardHandleRefs = useRef<Array<ProjectIceCardHandle | null>>([]);
  const wrapperRefs = useRef<Array<HTMLDivElement | null>>([]);
  const prevSlotsRef = useRef<Array<Slot | null>>([]);
  const decodedImagePromisesRef = useRef<Map<string, Promise<void>>>(new Map());
  const graphSyncTimeoutRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  const clearDeckTimers = useCallback(() => {
    if (graphSyncTimeoutRef.current !== null) {
      window.clearTimeout(graphSyncTimeoutRef.current);
      graphSyncTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const slotFor = useCallback(
    (offset: number): Slot => {
      if (slotMap[offset]) return slotMap[offset];
      const sign = offset > 0 ? 1 : -1;
      return slotMap[sign * 2];
    },
    [slotMap],
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const recompute = () => {
      const w = stage.clientWidth || 1056;
      setSlotMap((prev) => {
        const next = buildSlotMap(w);
        if (
          prev[0]?.x === next[0].x &&
          prev[-1]?.x === next[-1].x &&
          prev[-2]?.x === next[-2].x
        ) {
          return prev;
        }
        return next;
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sizerEl = sizerRef.current;
    if (!section || !sizerEl) return;

    const minH = isMobileDeck ? 414 : 468;

    const apply = () => {
      const h = Math.ceil(sizerEl.getBoundingClientRect().height);
      if (h > 0) {
        section.style.setProperty("--ice-card-h", `${Math.max(h, minH)}px`);
      }
    };

    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(sizerEl);

    return () => ro.disconnect();
  }, [dictionary.labels.comingSoon, isMobileDeck, projects]);

  const decodeCardImage = useCallback((project?: ProjectContent) => {
    if (!project || typeof window === "undefined") return Promise.resolve();
    if (!project.imageBasePath) return Promise.resolve();

    const src = `${project.imageBasePath}/card.webp`;
    const existing = decodedImagePromisesRef.current.get(src);
    if (existing) return existing;

    const img = new Image();
    img.decoding = "async";
    img.src = src;
    const promise: Promise<void> =
      typeof img.decode === "function"
        ? img
            .decode()
            .then(() => undefined)
            .catch(() => undefined)
        : Promise.resolve();

    decodedImagePromisesRef.current.set(src, promise);
    return promise;
  }, []);

  useEffect(() => {
    projects.forEach((project) => {
      void decodeCardImage(project);
    });
  }, [decodeCardImage, projects]);

  useLayoutEffect(() => {
    wrapperRefs.current.forEach((el, i) => {
      if (!el) return;
      const newSlot = slotFor(signedOffset(focalIndex, i, total));
      if (isMobileDeck) {
        gsap.killTweensOf(el);
        gsap.set(el, {
          x: newSlot.x,
          scale: newSlot.scale,
          opacity: newSlot.opacity,
          zIndex: newSlot.zIndex,
        });
        prevSlotsRef.current[i] = newSlot;
        return;
      }
      const prev = prevSlotsRef.current[i];
      if (prev) {
        gsap.fromTo(
          el,
          {
            x: prev.x,
            scale: prev.scale,
            opacity: prev.opacity,
            zIndex: prev.zIndex,
          },
          {
            x: newSlot.x,
            scale: newSlot.scale,
            opacity: newSlot.opacity,
            zIndex: newSlot.zIndex,
            duration: DECK_TWEEN_MS / 1000,
            ease: "power3.out",
            overwrite: "auto",
          },
        );
      }
      prevSlotsRef.current[i] = newSlot;
    });
  }, [focalIndex, total, slotFor, isMobileDeck]);

  useEffect(() => {
    return () => {
      clearDeckTimers();
    };
  }, [clearDeckTimers]);

  const syncGraphAfterDeckTween = useCallback(
    (projectId: string) => {
      clearDeckTimers();
      if (isMobileDeck) {
        setIsTransitioning(false);
        activeApi.set(projectId);
        return;
      }
      setIsTransitioning(true);
      graphSyncTimeoutRef.current = window.setTimeout(() => {
        activeApi.set(projectId);
        graphSyncTimeoutRef.current = null;
      }, DECK_GRAPH_SYNC_DELAY_MS);
      transitionTimeoutRef.current = window.setTimeout(() => {
        setIsTransitioning(false);
        transitionTimeoutRef.current = null;
      }, DECK_GRAPH_SYNC_DELAY_MS);
    },
    [activeApi, clearDeckTimers, isMobileDeck],
  );

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const next = (focalIndex + dir + total) % total;
      const project = projects[next];
      if (project) {
        void decodeCardImage(project);
        setFocalIndex(next);
        syncGraphAfterDeckTween(project.id);
      }
    },
    [decodeCardImage, focalIndex, projects, syncGraphAfterDeckTween, total],
  );

  const focusProject = useCallback(
    (id: string) => {
      const idx = projects.findIndex((p) => p.id === id);
      if (idx >= 0) setFocalIndex(idx);
    },
    [projects],
  );

  const activateDeckProject = useCallback(
    (id: string) => {
      focusProject(id);
      syncGraphAfterDeckTween(id);
    },
    [focusProject, syncGraphAfterDeckTween],
  );

  useLayoutEffect(() => {
    let disposed = false;
    const syncActiveProject = (projectId: string | null) => {
      if (disposed) return;
      if (projectId) focusProject(projectId);
    };
    const unsubscribe = activeApi.subscribe(syncActiveProject);
    const current = activeApi.get();
    if (current) queueMicrotask(() => syncActiveProject(current));

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [activeApi, focusProject]);

  const handleStageKey = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        cycle(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        cycle(-1);
      }
    },
    [cycle],
  );

  const sectionStyle: CSSProperties = {
    paddingInline: "var(--slab-gutter)",
    paddingBlock: "0",
  };

  const renderedProjects = isMobileDeck
    ? [{ project: projects[focalIndex], index: focalIndex, key: "mobile-focal" }]
    : projects.map((project, index) => ({
        project,
        index,
        key: project.id,
      }));

  return (
    <section
      ref={sectionRef}
      aria-label={dictionary.sections.cardsEyebrow}
      className="relative"
      style={sectionStyle}
    >
      <div
        ref={sizerRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 grid"
        style={{ width: "var(--ice-card-w)" }}
      >
        {projects.map((project) => (
          <div key={`sizer-${project.id}`} className="col-start-1 row-start-1">
            <ProjectIceCard
              project={project}
              comingSoonLabel={dictionary.labels.comingSoon}
              mobile={isMobileDeck}
              sizer
            />
          </div>
        ))}
      </div>
      <div
        ref={stageRef}
        className="relative mx-auto"
        role="region"
        aria-roledescription="Project ice deck"
        aria-label={dictionary.sections.cardsEyebrow}
        onKeyDown={handleStageKey}
        tabIndex={0}
        style={{
          width: "100%",
          maxWidth: "var(--slab-width)",
          height: isMobileDeck ? "auto" : "var(--ice-card-h)",
        }}
      >
        {renderedProjects.map(({ project, index: i, key }) => {
          const slot = slotFor(signedOffset(focalIndex, i, total));
          return (
            <div
              key={key}
              ref={(el) => {
                wrapperRefs.current[i] = el;
              }}
              className={isMobileDeck ? "relative" : "absolute left-1/2 top-1/2"}
              style={{
                marginLeft: isMobileDeck
                  ? 0
                  : "calc(var(--ice-card-w) * -0.5)",
                marginTop: isMobileDeck
                  ? 0
                  : "calc(var(--ice-card-h) * -0.5)",
                transform: isMobileDeck
                  ? "none"
                  : `translate3d(${slot.x}px, 0, 0) scale(${slot.scale})`,
                opacity: slot.opacity,
                zIndex: slot.zIndex,
                willChange: "transform, opacity",
              }}
            >
              <ProjectIceCard
                ref={(handle) => {
                  cardHandleRefs.current[i] = handle;
                }}
                project={project}
                comingSoonLabel={dictionary.labels.comingSoon}
                focal={i === focalIndex}
                mobile={isMobileDeck}
                transitioning={isTransitioning && i === focalIndex}
                onActivate={() => activateDeckProject(project.id)}
              />
            </div>
          );
        })}

        <DeckControls
          mobile={isMobileDeck}
          focalIndex={focalIndex}
          total={total}
          onPrev={() => cycle(-1)}
          onNext={() => cycle(1)}
        />
      </div>

    </section>
  );
}

interface DeckControlsProps {
  mobile?: boolean;
  focalIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function frostBurst(button: HTMLElement, host: HTMLElement) {
  gsap
    .timeline({ overwrite: "auto" })
    .to(button, {
      scale: 0.95,
      rotation: -1.4,
      duration: 0.08,
      ease: "power2.out",
    })
    .to(button, {
      scale: 1.02,
      rotation: 1.2,
      duration: 0.14,
      ease: "back.out(1.8)",
    })
    .to(button, {
      scale: 1.0,
      rotation: 0,
      duration: 0.16,
      ease: "power2.out",
    });

  const rect = button.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const cx = rect.left - hostRect.left + rect.width / 2;
  const cy = rect.top - hostRect.top + rect.height / 2;

  const ring = document.createElement("span");
  ring.style.position = "absolute";
  ring.style.left = `${cx}px`;
  ring.style.top = `${cy}px`;
  ring.style.width = "24px";
  ring.style.height = "24px";
  ring.style.marginLeft = "-12px";
  ring.style.marginTop = "-12px";
  ring.style.borderRadius = "50%";
  ring.style.border = "1.5px solid rgba(220, 240, 252, 0.5)";
  ring.style.boxShadow = "0 0 16px rgba(180, 220, 240, 0.45)";
  ring.style.pointerEvents = "none";
  ring.style.zIndex = "49";
  host.appendChild(ring);
  gsap.fromTo(
    ring,
    { scale: 0.4, opacity: 0.55 },
    {
      scale: 3.4,
      opacity: 0,
      duration: 0.42,
      ease: "power2.out",
      onComplete: () => ring.remove(),
    },
  );
}

function DeckControls({
  mobile = false,
  focalIndex,
  total,
  onPrev,
  onNext,
}: DeckControlsProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  const handlePrev = () => {
    if (prevRef.current && hostRef.current) {
      frostBurst(prevRef.current, hostRef.current);
    }
    onPrev();
  };
  const handleNext = () => {
    if (nextRef.current && hostRef.current) {
      frostBurst(nextRef.current, hostRef.current);
    }
    onNext();
  };

  return (
    <div
      ref={hostRef}
      className={
        mobile
          ? "pointer-events-none relative z-40 mt-6 flex items-center justify-center gap-3"
          : "pointer-events-none absolute inset-x-0 bottom-[-3rem] z-40 flex items-center justify-center gap-3"
      }
      style={{ overflow: "visible" }}
    >
      <button
        ref={prevRef}
        type="button"
        onClick={handlePrev}
        className="btn-nav btn-nav--text"
      >
        Prev
      </button>
      <span className="pointer-events-none font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-50/80">
        {focalIndex + 1} / {total}
      </span>
      <button
        ref={nextRef}
        type="button"
        onClick={handleNext}
        className="btn-nav btn-nav--text"
      >
        Next
      </button>
    </div>
  );
}
