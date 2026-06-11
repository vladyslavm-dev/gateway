"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  useActiveProjectApi,
  useActiveProjectId,
} from "@/lib/state/active-project";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  consumePreservedActiveProjectId,
  readLastShownProjectId,
  saveLastShownProjectId,
} from "@/lib/state/reference-context";
import type {
  CategoryId,
  LocaleDictionary,
  ProjectContent,
  ProjectId,
} from "@/lib/site-config.types";

type NodeKind = "project" | "category" | "skill";

type GraphNode = SimulationNodeDatum & {
  id: string;
  kind: NodeKind;
  projectId: ProjectId;
  categoryId?: CategoryId;
  categoryIndex?: number;
  skillIndex?: number;
  totalCategories?: number;
  label: string;
  iconShape: "circle" | "diamond" | "square" | "triangle" | "chip";
  radius: number;
  padX: number;
  padBottom: number;
};

type GraphLink = SimulationLinkDatum<GraphNode> & {
  source: string | GraphNode;
  target: string | GraphNode;
};

export interface GraphDustSnapshot {
  width: number;
  height: number;
  nodes: Array<{
    id: string;
    kind: NodeKind;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
  }>;
  links: Array<{ sx: number; sy: number; tx: number; ty: number }>;
}

type ProjectsGraphIslandProps = {
  dictionary: LocaleDictionary;
  projects: ProjectContent[];
  dustSnapshotRef?: MutableRefObject<GraphDustSnapshot | null>;
  onReady?: () => void;
};

const SKILLS_PER_CATEGORY = 3;
const WALL_DAMPING = 0.14;
const RELAYOUT_WARMUP_TICKS = 120;
const SKILL_FADE_MS = 260;
const DRAG_CLICK_THRESHOLD = 3;

type GraphLayoutConfig = {
  labels: Record<
    NodeKind,
    { fontSize: number; letterSpacingEm: number; yOffset: number }
  >;
  categoryOffset: number;
  skillOffset: number;
  spawnPadding: number;
  spawnJitter: number;
  showSkillLabels: boolean;
};

const DESKTOP_GRAPH_CONFIG: GraphLayoutConfig = {
  labels: {
    project: { fontSize: 11, letterSpacingEm: 0.2, yOffset: 18 },
    category: { fontSize: 10, letterSpacingEm: 0.18, yOffset: 14 },
    skill: { fontSize: 9, letterSpacingEm: 0.16, yOffset: 12 },
  },
  categoryOffset: 110,
  skillOffset: 50,
  spawnPadding: 120,
  spawnJitter: 16,
  showSkillLabels: true,
};

const MOBILE_GRAPH_CONFIG: GraphLayoutConfig = {
  labels: {
    project: { fontSize: 10, letterSpacingEm: 0.2, yOffset: 16 },
    category: { fontSize: 9, letterSpacingEm: 0.18, yOffset: 12 },
    skill: { fontSize: 8, letterSpacingEm: 0.16, yOffset: 10 },
  },
  categoryOffset: 80,
  skillOffset: 36,
  spawnPadding: 80,
  spawnJitter: 10,
  showSkillLabels: false,
};

export function getGraphLayoutConfig(isMobile: boolean) {
  return isMobile ? MOBILE_GRAPH_CONFIG : DESKTOP_GRAPH_CONFIG;
}

type LabelConfig = Record<
  NodeKind,
  { fontSize: number; letterSpacingEm: number; yOffset: number }
>;

const MONO_CHAR_WIDTH_EM = 0.6;
const LABEL_PAD_SAFETY_PX = 4;

export function measureLabelPad(
  kind: NodeKind,
  label: string,
  radius: number,
  labels: LabelConfig = DESKTOP_GRAPH_CONFIG.labels,
): { padX: number; padBottom: number } {
  const cfg = labels[kind];
  const charPx = cfg.fontSize * MONO_CHAR_WIDTH_EM;
  const lsPx = cfg.fontSize * cfg.letterSpacingEm;
  const n = label.length;
  const textWidth = n * charPx + Math.max(0, n - 1) * lsPx;
  const padX = Math.max(radius, textWidth / 2 + LABEL_PAD_SAFETY_PX);
  const descent = cfg.fontSize * 0.25;
  const padBottom = Math.max(
    radius,
    radius + cfg.yOffset + descent + LABEL_PAD_SAFETY_PX,
  );
  return { padX, padBottom };
}

function randomInView(size: number, padding: number) {
  const span = Math.max(1, size - padding * 2);
  return padding + Math.random() * span;
}

const PROJECT_QUADRANTS: Array<{ fx: number; fy: number }> = [
  { fx: 0.28, fy: 0.36 },
  { fx: 0.72, fy: 0.36 },
  { fx: 0.28, fy: 0.68 },
  { fx: 0.72, fy: 0.68 },
];

const PROJECT_RADIUS = 14;
const CATEGORY_RADIUS = 10;
const SKILL_RADIUS = 9;

const PROJECT_ICONS: GraphNode["iconShape"][] = [
  "circle",
  "triangle",
  "square",
  "diamond",
];

const GRAPH_SKILL_LABEL_OVERRIDES = new Map<string, string>([
  ["Angular Material", "Material"],
  ["FluentValidation", "Validation"],
  ["GitHub Actions", "Actions"],
  ["JSON Schema", "Schema"],
  ["NgRx Signals", "NgRx"],
  ["Spring Security", "Security"],
  ["Static Export", "Export"],
  ["Tailwind CSS", "Tailwind"],
  ["Testcontainers", "Containers"],
]);

function getGraphSkillLabel(skill: string) {
  return GRAPH_SKILL_LABEL_OVERRIDES.get(skill) ?? skill;
}

function pickRandomProjectId(projects: ProjectContent[]) {
  return projects[Math.floor(Math.random() * projects.length)]?.id ?? null;
}

function pickInitialProjectId(projects: ProjectContent[]) {
  if (projects.length === 0) return null;

  const preserved = consumePreservedActiveProjectId();
  if (preserved && projects.some((project) => project.id === preserved)) {
    saveLastShownProjectId(preserved);
    return preserved;
  }

  const last = readLastShownProjectId();
  const candidates =
    projects.length > 1
      ? projects.filter((project) => project.id !== last)
      : projects;
  const pick = pickRandomProjectId(candidates.length > 0 ? candidates : projects);
  if (pick) saveLastShownProjectId(pick);
  return pick;
}

function buildGraph(
  projects: ProjectContent[],
  renderingCategoryIds: ReadonlySet<string>,
  view: { w: number; h: number },
  positions: Map<string, { x: number; y: number }>,
  projectSeeds: Map<string, { x: number; y: number }>,
  centerProjectId: string | null,
  config: GraphLayoutConfig,
): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  projects.forEach((project, projectIndex) => {
    const projectNodeId = `project-${project.id}`;
    let seed = projectSeeds.get(projectNodeId);
    if (!seed) {
      if (project.id === centerProjectId) {
        seed = { x: view.w / 2, y: view.h / 2 };
      } else {
        const quad = PROJECT_QUADRANTS[projectIndex];
        if (quad) {
          seed = { x: quad.fx * view.w, y: quad.fy * view.h };
        } else {
          seed = {
            x: randomInView(view.w, config.spawnPadding),
            y: randomInView(view.h, config.spawnPadding),
          };
        }
      }
      projectSeeds.set(projectNodeId, seed);
    }
    const spawnX = positions.get(projectNodeId)?.x ?? seed.x;
    const spawnY = positions.get(projectNodeId)?.y ?? seed.y;

    const projectPad = measureLabelPad(
      "project",
      project.title.toUpperCase(),
      PROJECT_RADIUS,
      config.labels,
    );
    nodes.push({
      id: projectNodeId,
      kind: "project",
      projectId: project.id,
      label: project.title,
      iconShape: PROJECT_ICONS[projectIndex % PROJECT_ICONS.length],
      radius: PROJECT_RADIUS,
      padX: projectPad.padX,
      padBottom: projectPad.padBottom,
      x: spawnX,
      y: spawnY,
    });

    project.categories.forEach((category, categoryIndex) => {
      const angle =
        (Math.PI * 2 * categoryIndex) / project.categories.length -
        Math.PI / 2;
      const categoryNodeId = `${project.id}-${category.id}`;
      const catPos = positions.get(categoryNodeId);

      const categoryPad = measureLabelPad(
        "category",
        category.label.toUpperCase(),
        CATEGORY_RADIUS,
        config.labels,
      );
      nodes.push({
        id: categoryNodeId,
        kind: "category",
        projectId: project.id,
        categoryId: category.id,
        categoryIndex,
        totalCategories: project.categories.length,
        label: category.label,
        iconShape: "chip",
        radius: CATEGORY_RADIUS,
        padX: categoryPad.padX,
        padBottom: categoryPad.padBottom,
        x:
          catPos?.x ??
            spawnX +
            Math.cos(angle) * config.categoryOffset +
            (Math.random() - 0.5) * config.spawnJitter,
        y:
          catPos?.y ??
            spawnY +
            Math.sin(angle) * config.categoryOffset +
            (Math.random() - 0.5) * config.spawnJitter,
      });
      links.push({ source: projectNodeId, target: categoryNodeId });

      if (renderingCategoryIds.has(categoryNodeId)) {
        const skillsToRender = category.skills.slice(0, SKILLS_PER_CATEGORY);
        const anchor = catPos ?? {
          x: spawnX + Math.cos(angle) * config.categoryOffset,
          y: spawnY + Math.sin(angle) * config.categoryOffset,
        };
        skillsToRender.forEach((skill, skillIndex) => {
          const skillLabel = getGraphSkillLabel(skill);
          const skillAngle =
            angle +
            ((skillIndex - (skillsToRender.length - 1) / 2) * Math.PI) / 4;
          const skillNodeId = `${categoryNodeId}-skill-${skillIndex}`;
          const skillPos = positions.get(skillNodeId);

          const skillPad = measureLabelPad(
            "skill",
            config.showSkillLabels ? skillLabel.toUpperCase() : "",
            SKILL_RADIUS,
            config.labels,
          );
          nodes.push({
            id: skillNodeId,
            kind: "skill",
            projectId: project.id,
            categoryId: category.id,
            skillIndex,
            label: skillLabel,
            iconShape: "chip",
            radius: SKILL_RADIUS,
            padX: skillPad.padX,
            padBottom: skillPad.padBottom,
            x:
              skillPos?.x ??
              anchor.x +
              Math.cos(skillAngle) * config.skillOffset +
              (Math.random() - 0.5) * config.spawnJitter,
            y:
              skillPos?.y ??
              anchor.y +
              Math.sin(skillAngle) * config.skillOffset +
              (Math.random() - 0.5) * config.spawnJitter,
          });
          links.push({ source: categoryNodeId, target: skillNodeId });
        });
      }
    });
  });

  return { nodes, links };
}

function buildGhostSkillNodes(
  projects: ProjectContent[],
  renderingCategoryIds: ReadonlySet<string>,
  expandedCategoryIds: ReadonlySet<string>,
  positions: Map<string, { x: number; y: number }>,
  config: GraphLayoutConfig,
) {
  const nodes: GraphNode[] = [];

  projects.forEach((project) => {
    project.categories.forEach((category) => {
      const categoryNodeId = `${project.id}-${category.id}`;
      if (
        !renderingCategoryIds.has(categoryNodeId) ||
        expandedCategoryIds.has(categoryNodeId)
      ) {
        return;
      }

      category.skills.slice(0, SKILLS_PER_CATEGORY).forEach((skill, skillIndex) => {
        const skillNodeId = `${categoryNodeId}-skill-${skillIndex}`;
        const saved = positions.get(skillNodeId);
        if (!saved) {
          return;
        }

        const skillLabel = getGraphSkillLabel(skill);
        const skillPad = measureLabelPad(
          "skill",
          config.showSkillLabels ? skillLabel.toUpperCase() : "",
          SKILL_RADIUS,
          config.labels,
        );

        nodes.push({
          id: skillNodeId,
          kind: "skill",
          projectId: project.id,
          categoryId: category.id,
          skillIndex,
          label: skillLabel,
          iconShape: "chip",
          radius: SKILL_RADIUS,
          padX: skillPad.padX,
          padBottom: skillPad.padBottom,
          x: saved.x,
          y: saved.y,
        });
      });
    });
  });

  return nodes;
}

function categoryNodeIdsForProject(
  projects: ProjectContent[],
  projectId: string | null,
) {
  if (!projectId) return new Set<string>();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return new Set<string>();
  return new Set(project.categories.map((c) => `${projectId}-${c.id}`));
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

function NodeIcon({
  shape,
  active,
}: {
  shape: GraphNode["iconShape"];
  active: boolean;
}) {
  const stroke = active
    ? "rgba(20, 44, 72, 0.88)"
    : "rgba(56, 88, 122, 0.62)";
  const sw = active ? 1.1 : 0.85;
  switch (shape) {
    case "triangle":
      return (
        <polygon
          points="0,-3.6 3.2,2.8 -3.2,2.8"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case "square":
      return (
        <rect
          x={-3.2}
          y={-3.2}
          width={6.4}
          height={6.4}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    case "diamond":
      return (
        <polygon
          points="0,-3.8 3.6,0 0,3.8 -3.6,0"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case "chip":
      return null;
    case "circle":
    default:
      return (
        <circle
          r={3.2}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
        />
      );
  }
}

function ProjectNodeImage({
  href,
  radius,
  active,
}: {
  href: string;
  radius: number;
  active: boolean;
}) {
  const size = radius * (active ? 1.15 : 0.92);

  return (
    <image
      href={href}
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      opacity={active ? 0.95 : 0.5}
      style={{
        filter: active ? undefined : "grayscale(1) saturate(0.35)",
        pointerEvents: "none",
        transition: `opacity ${SKILL_FADE_MS}ms ease-out`,
      }}
    />
  );
}

export default function ProjectsGraphIsland({
  dictionary,
  projects,
  dustSnapshotRef,
  onReady,
}: ProjectsGraphIslandProps) {
  const activeApi = useActiveProjectApi();
  const activeProjectId = useActiveProjectId();
  const isMobileGraph = useMediaQuery("(max-width: 768px)");
  const graphConfig = getGraphLayoutConfig(isMobileGraph);
  const projectIconPaths = useMemo(
    () => new Map(projects.map((project) => [project.id, project.iconPath])),
    [projects],
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<{ w: number; h: number } | null>(null);
  const viewRef = useRef({ w: 0, h: 0 });
  viewRef.current = view ?? { w: 0, h: 0 };
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const projectSeedsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const readyRef = useRef(false);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = (w: number, h: number) => {
      if (w > 0 && h > 0) {
        setView((prev) =>
          prev?.w === Math.round(w) && prev.h === Math.round(h)
            ? prev
            : { w: Math.round(w), h: Math.round(h) },
        );
      }
    };
    apply(el.clientWidth, el.clientHeight);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.contentRect;
        apply(box.width, box.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prevViewRef = useRef<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    if (!view) return;
    const prev = prevViewRef.current;
    prevViewRef.current = view;
    if (!prev || (prev.w === view.w && prev.h === view.h)) return;
    const sx = view.w / prev.w;
    const sy = view.h / prev.h;
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx <= 0 || sy <= 0) {
      return;
    }
    positionsRef.current.forEach((pos, id) => {
      positionsRef.current.set(id, { x: pos.x * sx, y: pos.y * sy });
    });
    projectSeedsRef.current.forEach((pos, id) => {
      projectSeedsRef.current.set(id, { x: pos.x * sx, y: pos.y * sy });
    });
  }, [view]);

  const [initialPickId] = useState<string | null>(() => {
    return pickInitialProjectId(projects);
  });
  const [layoutCenterProjectId, setLayoutCenterProjectId] = useState<
    string | null
  >(() => initialPickId);
  const initialExpandedIds = useMemo(
    () => categoryNodeIdsForProject(projects, initialPickId),
    [projects, initialPickId],
  );

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(initialExpandedIds),
  );
  const [rendering, setRendering] = useState<Set<string>>(
    () => new Set(initialExpandedIds),
  );
  const removalTimeoutsRef = useRef<Map<string, number>>(new Map());
  const expandedRef = useRef<Set<string>>(expanded);
  const skipActiveProjectCenterRef = useRef(false);

  const setExpansion = useCallback((next: Set<string>) => {
    const prev = expandedRef.current;
    expandedRef.current = next;
    setExpanded(next);
    setRendering((r) => {
      let changed = false;
      const merged = new Set(r);
      for (const id of next) {
        if (!merged.has(id)) {
          merged.add(id);
          changed = true;
        }
      }
      return changed ? merged : r;
    });
    for (const id of prev) {
      const stillOn = next.has(id);
      const pending = removalTimeoutsRef.current.get(id);
      if (stillOn && pending !== undefined) {
        window.clearTimeout(pending);
        removalTimeoutsRef.current.delete(id);
      } else if (!stillOn && pending === undefined) {
        const handle = window.setTimeout(() => {
          setRendering((r) => {
            if (!r.has(id)) return r;
            const nr = new Set(r);
            nr.delete(id);
            return nr;
          });
          removalTimeoutsRef.current.delete(id);
        }, SKILL_FADE_MS);
        removalTimeoutsRef.current.set(id, handle);
      }
    }
  }, []);

  useEffect(() => {
    const timeouts = removalTimeoutsRef.current;
    return () => {
      timeouts.forEach((handle) => window.clearTimeout(handle));
      timeouts.clear();
    };
  }, []);

  const resetGraphToSeedLayout = useCallback((projectId: string) => {
    const sim = simulationRef.current;
    sim?.stop();
    positionsRef.current.clear();
    projectSeedsRef.current.clear();
    setLayoutCenterProjectId(projectId);
  }, []);

  const previousActiveProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = previousActiveProjectIdRef.current;
    previousActiveProjectIdRef.current = activeProjectId;
    if (prev === activeProjectId) {
      return;
    }
    const shouldCenter = !skipActiveProjectCenterRef.current;
    skipActiveProjectCenterRef.current = false;
    if (activeProjectId === null) {
      if (expandedRef.current.size > 0) {
        setExpansion(new Set());
      }
      return;
    }
    if (shouldCenter) {
      resetGraphToSeedLayout(activeProjectId);
    }
    const next = categoryNodeIdsForProject(projects, activeProjectId);
    if (!sameSet(expandedRef.current, next)) {
      setExpansion(next);
    }
  }, [activeProjectId, projects, resetGraphToSeedLayout, setExpansion]);

  const defaultOpenAppliedRef = useRef(false);
  useEffect(() => {
    if (defaultOpenAppliedRef.current) return;
    defaultOpenAppliedRef.current = true;
    if (!initialPickId) return;
    if (activeApi.get() !== null) return;
    const pick = projects.find((p) => p.id === initialPickId);
    if (!pick) return;
    activeApi.set(pick.id);
    const next = categoryNodeIdsForProject(projects, pick.id);
    if (!sameSet(expandedRef.current, next)) {
      setExpansion(next);
    }
  }, [projects, activeApi, setExpansion, initialPickId]);

  const graph = useMemo<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>(() => {
    if (!view) {
      return { nodes: [], links: [] };
    }
    return buildGraph(
      projects,
      expanded,
      view,
      positionsRef.current,
      projectSeedsRef.current,
      layoutCenterProjectId,
      graphConfig,
    );
  }, [projects, expanded, view, layoutCenterProjectId, graphConfig]);
  const { nodes, links } = graph;

  const ghostSkillNodes = useMemo(
    () =>
      buildGhostSkillNodes(
        projects,
        rendering,
        expanded,
        positionsRef.current,
        graphConfig,
      ),
    [projects, rendering, expanded, graphConfig],
  );

  const renderNodes = useMemo(
    () => (ghostSkillNodes.length > 0 ? [...nodes, ...ghostSkillNodes] : nodes),
    [nodes, ghostSkillNodes],
  );

  const [, setVersion] = useState(0);
  const commitSimulationFrame = useCallback(
    (sim: Simulation<GraphNode, GraphLink>) => {
      const v = viewRef.current;
      const simNodes = sim.nodes();
      for (const node of simNodes) {
        const r = node.radius;
        const padX = node.padX;
        const padBottom = node.padBottom;
        const padTop = r;
        if (typeof node.x === "number") {
          if (node.x < padX) {
            node.x = padX;
            if (typeof node.vx === "number") node.vx = -node.vx * WALL_DAMPING;
          } else if (node.x > v.w - padX) {
            node.x = v.w - padX;
            if (typeof node.vx === "number") node.vx = -node.vx * WALL_DAMPING;
          }
        }
        if (typeof node.y === "number") {
          if (node.y < padTop) {
            node.y = padTop;
            if (typeof node.vy === "number") node.vy = -node.vy * WALL_DAMPING;
          } else if (node.y > v.h - padBottom) {
            node.y = v.h - padBottom;
            if (typeof node.vy === "number") node.vy = -node.vy * WALL_DAMPING;
          }
        }
        if (typeof node.x === "number" && typeof node.y === "number") {
          positionsRef.current.set(node.id, { x: node.x, y: node.y });
        }
      }
      if (dustSnapshotRef) {
        const simLinks =
          (
            sim.force("link") as ReturnType<
              typeof forceLink<GraphNode, GraphLink>
            > | null
          )?.links() ?? [];
        const snapNodes = simNodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          x: n.x ?? 0,
          y: n.y ?? 0,
          vx: n.vx ?? 0,
          vy: n.vy ?? 0,
          radius: n.radius,
        }));
        const snapLinks = simLinks.map((l) => {
          const s = l.source as GraphNode;
          const t = l.target as GraphNode;
          return {
            sx: s.x ?? 0,
            sy: s.y ?? 0,
            tx: t.x ?? 0,
            ty: t.y ?? 0,
          };
        });
        dustSnapshotRef.current = {
          width: v.w,
          height: v.h,
          nodes: snapNodes,
          links: snapLinks,
        };
      }
      setVersion((v2) => (v2 + 1) % 1_000_000);
    },
    [dustSnapshotRef],
  );

  useEffect(() => {
    let rafId = 0;
    let watchdogId = 0;
    let lastFrame = performance.now();
    let flip = false;

    const nudge = () => {
      const el = svgRef.current;
      if (!el) return;
      flip = !flip;
      el.style.transform = flip ? "translateZ(0)" : "";
    };

    const repaint = () => {
      rafId = 0;
      const sim = simulationRef.current;
      if (sim) {
        commitSimulationFrame(sim);
      }
      nudge();
    };

    const scheduleRepaint = () => {
      if (!rafId) rafId = requestAnimationFrame(repaint);
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      scheduleRepaint();
    };

    const watchdog = (now: number) => {
      if (now - lastFrame > 4000) {
        scheduleRepaint();
      }
      lastFrame = now;
      watchdogId = requestAnimationFrame(watchdog);
    };
    watchdogId = requestAnimationFrame(watchdog);

    const heartbeatId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        nudge();
      }
    }, 4000);

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (watchdogId) cancelAnimationFrame(watchdogId);
      window.clearInterval(heartbeatId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [commitSimulationFrame]);
  const draggingRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!view) return;

    const sim = forceSimulation<GraphNode>([])
      .force(
        "link",
        forceLink<GraphNode, GraphLink>([])
          .id((n) => n.id)
          .distance((link) => {
            const target =
              typeof link.target === "string" ? null : link.target;
            return target?.kind === "skill"
              ? graphConfig.skillOffset
              : graphConfig.categoryOffset;
          })
          .strength(0.28),
      )
      .force("charge", forceManyBody<GraphNode>().strength(-95))
      .force(
        "collide",
        forceCollide<GraphNode>().radius((n) =>
          Math.max(n.radius + 8, n.padX + 3),
        ),
      )
      .velocityDecay(0.5)
      .alpha(0.6)
      .on("tick", () => {
        commitSimulationFrame(sim);
      });
    simulationRef.current = sim;
    return () => {
      sim.stop();
      simulationRef.current = null;
    };
  }, [commitSimulationFrame, graphConfig, view]);

  useEffect(() => {
    if (!view) return;
    const sim = simulationRef.current;
    if (!sim) return;
    const firstLayout = positionsRef.current.size === 0;
    for (const node of nodes) {
      const saved = positionsRef.current.get(node.id);
      if (saved) {
        // d3-force mutates node objects; restore saved coordinates across rebuilds.
        // eslint-disable-next-line react-hooks/immutability
        node.x = saved.x;
        node.y = saved.y;
      }
    }
    sim.nodes(nodes);
    const linkForce = sim.force("link") as ReturnType<
      typeof forceLink<GraphNode, GraphLink>
    > | null;
    if (linkForce) linkForce.links(links);
    if (firstLayout) {
      sim.alpha(0.9);
      for (let i = 0; i < 400; i += 1) sim.tick();
      commitSimulationFrame(sim);
      if (!readyRef.current) {
        readyRef.current = true;
        onReady?.();
      }
      sim.alpha(0.04).restart();
    } else {
      sim.alpha(0.32);
      for (let i = 0; i < RELAYOUT_WARMUP_TICKS; i += 1) sim.tick();
      commitSimulationFrame(sim);
      sim.alpha(0.06).restart();
    }
  }, [nodes, links, onReady, view, commitSimulationFrame]);

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: ((clientX - rect.left) / rect.width) * v.w,
      y: ((clientY - rect.top) / rect.height) * v.h,
    };
  }, []);

  const clampToLabelBox = useCallback(
    (node: GraphNode, x: number, y: number) => {
      const v = viewRef.current;
      const padX = node.padX;
      const padBottom = node.padBottom;
      const padTop = node.radius;
      return {
        x: Math.max(padX, Math.min(v.w - padX, x)),
        y: Math.max(padTop, Math.min(v.h - padBottom, y)),
      };
    },
    [],
  );

  const onNodePointerDown = useCallback(
    (nodeId: string, event: ReactPointerEvent<SVGElement>) => {
      event.preventDefault();
      const sim = simulationRef.current;
      if (!sim) return;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      draggingRef.current = {
        id: nodeId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
      const { x, y } = toSvgCoords(event.clientX, event.clientY);
      const clamped = clampToLabelBox(node, x, y);
      node.fx = clamped.x;
      node.fy = clamped.y;
      (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
    },
    [nodes, toSvgCoords, clampToLabelBox],
  );

  const onNodePointerMove = useCallback(
    (event: ReactPointerEvent<SVGElement>) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const node = nodes.find((n) => n.id === drag.id);
      if (!node) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) > DRAG_CLICK_THRESHOLD) {
        drag.moved = true;
        const sim = simulationRef.current;
        if (sim) {
          sim.velocityDecay(0.35);
          sim.alphaTarget(0.18).restart();
          const linkForce = sim.force("link") as ReturnType<
            typeof forceLink<GraphNode, GraphLink>
          > | null;
          if (linkForce) linkForce.strength(0.55);
        }
      }
      if (!drag.moved) return;
      event.preventDefault();
      const { x, y } = toSvgCoords(event.clientX, event.clientY);
      const clamped = clampToLabelBox(node, x, y);
      node.fx = clamped.x;
      node.fy = clamped.y;
    },
    [nodes, toSvgCoords, clampToLabelBox],
  );

  const onNodePointerUp = useCallback(
    (event: ReactPointerEvent<SVGElement>) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const sim = simulationRef.current;
      const node = nodes.find((n) => n.id === drag.id);
      if (sim && drag.moved) {
        sim.alphaTarget(0);
        sim.velocityDecay(0.5);
        const linkForce = sim.force("link") as ReturnType<
          typeof forceLink<GraphNode, GraphLink>
        > | null;
        if (linkForce) linkForce.strength(0.28);
        sim.alpha(0.02);
      }
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      draggingRef.current = null;
      try {
        (event.currentTarget as SVGElement).releasePointerCapture(
          event.pointerId,
        );
      } catch {
        /* pointer not captured */
      }
    },
    [nodes],
  );

  const handleProjectActivate = useCallback(
    (node: GraphNode) => {
      const isSame = activeApi.get() === node.projectId;
      if (isSame) {
        activeApi.clear();
        setExpansion(new Set());
        return;
      }
      const project = projects.find((p) => p.id === node.projectId);
      const newExpansion = new Set<string>();
      if (project) {
        for (const category of project.categories) {
          newExpansion.add(`${node.projectId}-${category.id}`);
        }
      }
      skipActiveProjectCenterRef.current = true;
      activeApi.set(node.projectId);
      setExpansion(newExpansion);
    },
    [activeApi, projects, setExpansion],
  );

  const handleCategoryActivate = useCallback(
    (node: GraphNode) => {
      const targetId = node.id;
      const currentProjectActive = activeApi.get();
      const sameProject = currentProjectActive === node.projectId;
      const currentExpansion = expandedRef.current;

      if (sameProject) {
        const next = new Set(currentExpansion);
        if (next.has(targetId)) {
          next.delete(targetId);
        } else {
          next.add(targetId);
        }
        setExpansion(next);
        return;
      }

      skipActiveProjectCenterRef.current = true;
      activeApi.set(node.projectId);
      setExpansion(new Set([targetId]));
    },
    [activeApi, setExpansion],
  );

  const handleNodeActivate = useCallback(
    (node: GraphNode) => {
      if (node.kind === "project") {
        handleProjectActivate(node);
        return;
      }
      if (node.kind === "category") {
        handleCategoryActivate(node);
      }
    },
    [handleProjectActivate, handleCategoryActivate],
  );

  const handleNodeKey = useCallback(
    (node: GraphNode, event: KeyboardEvent<SVGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNodeActivate(node);
      }
    },
    [handleNodeActivate],
  );

  const getNodeById = useCallback(
    (id: string | GraphNode): GraphNode | undefined => {
      if (typeof id !== "string") return id;
      return renderNodes.find((n) => n.id === id);
    },
    [renderNodes],
  );

  if (!view) {
    return <div ref={containerRef} className="relative h-full w-full" />;
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${view.w} ${view.h}`}
        preserveAspectRatio="none"
        width={view.w}
        height={view.h}
        className="absolute inset-0 h-full w-full select-none"
        role="group"
        aria-label={dictionary.sections.graphEyebrow}
        style={{ touchAction: "none", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="graph-fill-active" cx="32%" cy="26%" r="88%">
            <stop offset="0%" stopColor="#f5f8fa" stopOpacity="1" />
            <stop offset="40%" stopColor="#e0e8ed" stopOpacity="0.97" />
            <stop offset="75%" stopColor="#b8c6d0" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#8fa5b3" stopOpacity="0.86" />
          </radialGradient>
          <radialGradient id="graph-fill-hover" cx="32%" cy="26%" r="88%">
            <stop offset="0%" stopColor="#eef3f6" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#a2b7c3" stopOpacity="0.82" />
          </radialGradient>
          <radialGradient id="graph-fill-idle" cx="32%" cy="26%" r="88%">
            <stop offset="0%" stopColor="rgba(205, 220, 230, 0.52)" />
            <stop offset="100%" stopColor="rgba(110, 135, 152, 0.3)" />
          </radialGradient>
          <radialGradient id="graph-fill-skill" cx="32%" cy="26%" r="88%">
            <stop offset="0%" stopColor="#edf2f5" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#a5b8c3" stopOpacity="0.88" />
          </radialGradient>
          <radialGradient id="graph-highlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter
            id="graph-node-shadow"
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feDropShadow
              dx="0"
              dy="1.2"
              stdDeviation="2.2"
              floodColor="#0a1e30"
              floodOpacity="0.22"
            />
            <feDropShadow
              dx="0"
              dy="0.4"
              stdDeviation="0.6"
              floodColor="#0a1e30"
              floodOpacity="0.12"
            />
          </filter>
        </defs>
        <g>
          {links.map((link, index) => {
            const source = getNodeById(link.source);
            const target = getNodeById(link.target);
            if (!source || !target) return null;
            const isActiveProject =
              activeProjectId !== null &&
              (source.projectId === activeProjectId ||
                target.projectId === activeProjectId);
            const isSkillLink =
              source.kind === "category" || target.kind === "skill";
            const skillVisible =
              !isSkillLink ||
              (target.kind === "skill" && expanded.has(source.id));
            const linkOpacity = isSkillLink && !skillVisible ? 0 : 1;
            return (
              <line
                key={`link-${index}`}
                x1={source.x ?? 0}
                y1={source.y ?? 0}
                x2={target.x ?? 0}
                y2={target.y ?? 0}
                stroke={
                  isActiveProject
                    ? "rgba(24, 48, 72, 0.45)"
                    : "rgba(50, 82, 112, 0.2)"
                }
                strokeWidth={isActiveProject ? 0.8 : 0.6}
                strokeLinecap="round"
                style={{
                  opacity: linkOpacity,
                  transition: `opacity ${SKILL_FADE_MS}ms ease-out`,
                }}
              />
            );
          })}
        </g>
        <g>
          {renderNodes.map((node) => {
            const isHovered = hoveredId === node.id;
            const isFocused = focusedNodeId === node.id;
            const projectActive =
              activeProjectId !== null && node.projectId === activeProjectId;
            const dimmed =
              activeProjectId !== null && node.projectId !== activeProjectId;

            const baseRadius = node.radius;
            const radius =
              projectActive || isHovered ? baseRadius + 3 : baseRadius;

            let fillUrl: string;
            let stroke: string;
            let strokeWidth: number;
            let useShadow = true;
            let showHighlight = true;
            if (node.kind === "skill") {
              fillUrl = "url(#graph-fill-skill)";
              stroke = "transparent";
              strokeWidth = 0;
            } else if (projectActive) {
              fillUrl = "url(#graph-fill-active)";
              stroke = "transparent";
              strokeWidth = 0;
            } else if (isHovered) {
              fillUrl = "url(#graph-fill-hover)";
              stroke = "transparent";
              strokeWidth = 0;
            } else {
              fillUrl = "url(#graph-fill-idle)";
              stroke = "rgba(60, 100, 140, 0.25)";
              strokeWidth = 0.5;
              useShadow = false;
              showHighlight = false;
            }

            const projectLabelOpacity =
              projectActive || isHovered ? 1 : 0.72;

            const isInteractive =
              node.kind === "project" || node.kind === "category";
            const projectIconPath =
              node.kind === "project"
                ? projectIconPaths.get(node.projectId)
                : undefined;
            const hitRadius = isMobileGraph
              ? Math.max(radius, 22)
              : radius + (isFocused ? 6 : 0);
            const labelCfg = graphConfig.labels[node.kind];

            const parentId = `${node.projectId}-${node.categoryId}`;
            const skillOpacity =
              node.kind === "skill" ? (expanded.has(parentId) ? 1 : 0) : 1;
            const dimOpacity = dimmed && !isHovered ? 0.55 : 1;
            const finalOpacity = skillOpacity * dimOpacity;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
                tabIndex={isInteractive ? 0 : -1}
                role={isInteractive ? "button" : undefined}
                aria-label={isInteractive ? node.label : undefined}
                aria-pressed={
                  node.kind === "project" ? projectActive : undefined
                }
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() =>
                  setHoveredId((prev) => (prev === node.id ? null : prev))
                }
                onPointerDown={(event) => {
                  onNodePointerDown(node.id, event);
                }}
                onPointerMove={onNodePointerMove}
                onPointerUp={(event) => {
                  const drag = draggingRef.current;
                  const wasDrag = drag?.moved ?? false;
                  const ownsDrag = drag?.id === node.id;
                  onNodePointerUp(event);
                  if (ownsDrag && !wasDrag && isInteractive) {
                    handleNodeActivate(node);
                  }
                }}
                onFocus={() => setFocusedNodeId(node.id)}
                onBlur={() => setFocusedNodeId(null)}
                onKeyDown={(event) => handleNodeKey(node, event)}
                style={{
                  cursor: isInteractive ? "pointer" : "default",
                  opacity: finalOpacity,
                  transition: `opacity ${SKILL_FADE_MS}ms ease-out`,
                  pointerEvents: finalOpacity < 0.05 ? "none" : "auto",
                  outline: "none",
                }}
              >
                <circle
                  r={hitRadius}
                  fill="transparent"
                  stroke={
                    isFocused ? "rgba(22, 46, 74, 0.65)" : "transparent"
                  }
                  strokeDasharray={isFocused ? "3 4" : undefined}
                  strokeWidth={isFocused ? 1.5 : 0}
                  pointerEvents="all"
                />
                <circle
                  r={radius}
                  fill={fillUrl}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  filter={useShadow ? "url(#graph-node-shadow)" : undefined}
                />
                {showHighlight ? (
                  <ellipse
                    cx={-radius * 0.28}
                    cy={-radius * 0.38}
                    rx={radius * 0.55}
                    ry={radius * 0.22}
                    fill="url(#graph-highlight)"
                    pointerEvents="none"
                  />
                ) : null}
                <NodeIcon
                  shape={node.iconShape}
                  active={projectActive || isHovered}
                />
                {projectIconPath ? (
                  <ProjectNodeImage
                    href={projectIconPath}
                    radius={radius}
                    active={projectActive || isHovered}
                  />
                ) : null}
                {node.kind === "project" ? (
                  <text
                    y={radius + labelCfg.yOffset}
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fontSize: labelCfg.fontSize,
                      letterSpacing: `${labelCfg.letterSpacingEm}em`,
                      textTransform: "uppercase",
                      fill: projectActive
                        ? "rgba(14, 34, 58, 0.98)"
                        : "rgba(20, 44, 72, 0.95)",
                      opacity: projectLabelOpacity,
                      transition: "opacity 200ms ease-out",
                      pointerEvents: "none",
                    }}
                  >
                    {node.label}
                  </text>
                ) : null}
                {node.kind === "category" && (projectActive || isHovered) ? (
                  <text
                    y={radius + labelCfg.yOffset}
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fontSize: labelCfg.fontSize,
                      letterSpacing: `${labelCfg.letterSpacingEm}em`,
                      textTransform: "uppercase",
                      fill: projectActive
                        ? "rgba(22, 46, 74, 0.98)"
                        : "rgba(22, 46, 74, 0.95)",
                      pointerEvents: "none",
                    }}
                  >
                    {node.label}
                  </text>
                ) : null}
                {node.kind === "skill" && graphConfig.showSkillLabels ? (
                  <text
                    y={radius + labelCfg.yOffset}
                    textAnchor="middle"
                    style={{
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fontSize: labelCfg.fontSize,
                      letterSpacing: `${labelCfg.letterSpacingEm}em`,
                      textTransform: "uppercase",
                      fill: "rgba(22, 46, 74, 0.95)",
                      pointerEvents: "none",
                    }}
                  >
                    {node.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
