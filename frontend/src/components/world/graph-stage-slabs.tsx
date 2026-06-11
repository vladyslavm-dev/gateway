"use client";

import { gsap } from "gsap";
import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import { DustField } from "@/components/world/dust-field";
import { FrostField } from "@/components/world/frost-field";
import {
  FROSTED_PANEL_STYLE,
  FROSTED_PILL_STYLE,
} from "@/components/world/ice-glass";
import { Slab } from "@/components/world/slab";
import ProjectsGraphIsland, {
  type GraphDustSnapshot,
} from "@/components/projects/projects-graph-island";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  useActiveProjectApi,
  useActiveProjectId,
} from "@/lib/state/active-project";
import type {
  LocaleDictionary,
  ProjectContent,
} from "@/lib/site-config.types";

interface GraphStageSlabsProps {
  dictionary: LocaleDictionary;
  projects: ProjectContent[];
  onPopupHeightChange?: (h: number) => void;
  onGraphReady?: () => void;
}

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

type ProjectCategory = ProjectContent["categories"][number];

function SkillCategoryRow({
  category,
  mode = "visible",
}: {
  category: ProjectCategory;
  mode?: "visible" | "sizer";
}) {
  return (
    <div
      data-skill-row={mode}
      className="mx-auto flex w-full flex-col gap-3 p-3 md:max-w-full md:flex-row md:flex-nowrap md:items-center md:gap-4 md:p-4"
      style={FROSTED_PANEL_STYLE}
    >
      <p
        className="shrink-0 text-left text-[0.75rem] font-medium uppercase tracking-[0.18em] text-slate-800 md:w-40"
        style={{
          fontFamily: "var(--font-mono, ui-monospace)",
        }}
      >
        {category.label}
      </p>
      <div className="flex min-w-0 flex-wrap gap-2 md:flex-nowrap">
        {category.skills.map((skill) => (
          <span
            key={`${category.id}-${skill}`}
            className="px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-800"
            style={FROSTED_PILL_STYLE}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillRows({
  project,
  isMobilePopup,
  mode = "visible",
}: {
  project: ProjectContent;
  isMobilePopup: boolean;
  mode?: "visible" | "sizer";
}) {
  const isSizer = mode === "sizer";

  return (
    <div
      aria-hidden={isSizer ? true : undefined}
      data-skill-list={mode}
      className={
        isSizer
          ? "hidden md:grid md:w-fit md:max-w-full md:grid-cols-1 md:gap-3"
          : "mx-auto mt-3 grid w-full max-w-full grid-cols-1 gap-3 pb-4 md:mt-0 md:w-full md:pb-4"
      }
      style={{
        gridTemplateColumns: isMobilePopup
          ? undefined
          : isSizer
            ? "max-content"
            : "1fr",
        ...(isSizer
          ? {
              height: 0,
              overflow: "hidden",
              pointerEvents: "none",
              visibility: "hidden",
            }
          : null),
      }}
    >
      {project.categories.map((category) => (
        <SkillCategoryRow
          key={`${project.id}-${category.id}`}
          category={category}
          mode={mode}
        />
      ))}
    </div>
  );
}

export function GraphStageSlabs({
  dictionary,
  projects,
  onGraphReady,
  onPopupHeightChange,
}: GraphStageSlabsProps) {
  const graphSlabRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupContentRef = useRef<HTMLDivElement | null>(null);
  const dustSnapshotRef = useRef<GraphDustSnapshot | null>(null);

  const activeApi = useActiveProjectApi();
  const activeProjectId = useActiveProjectId();
  const isMobilePopup = useMediaQuery("(max-width: 768px)");
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const popupOpen = activeProjectId !== null;

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) ?? null;
  }, [projects, activeProjectId]);

  const frostRefs = useMemo(() => [graphSlabRef, popupRef], []);

  useEffect(() => {
    const slab = popupRef.current;
    const content = popupContentRef.current;
    if (!slab || !content) return;

    gsap.killTweensOf([slab, content]);

    if (popupOpen) {
      gsap.set(slab, { opacity: 1, pointerEvents: "auto", scale: 1, y: 0 });
      gsap.fromTo(
        content,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", delay: 0.1 },
      );
      return;
    }

    onPopupHeightChange?.(0);
    gsap.to(content, {
      opacity: 0,
      y: 8,
      duration: 0.16,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(slab, { opacity: 0, pointerEvents: "none" });
      },
    });
  }, [popupOpen, onPopupHeightChange]);

  useEffect(() => {
    const slab = popupRef.current;
    if (!slab || !onPopupHeightChange) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onPopupHeightChange(popupOpen ? entry.contentRect.height : 0);
      }
    });
    ro.observe(slab);
    return () => ro.disconnect();
  }, [onPopupHeightChange, popupOpen]);

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        activeApi.clear();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [popupOpen, activeApi]);

  return (
    <div
      className="relative mx-auto"
      style={{ width: "var(--slab-width)" }}
    >
      <Slab
        ref={graphSlabRef}
        variant="slab"
        className="relative overflow-hidden"
        style={{
          width: "100%",
          height: "var(--slab-height)",
        }}
      >
        <DustField slabRef={graphSlabRef} snapshotRef={dustSnapshotRef} />
        <div
          className="relative h-full w-full p-3 transition-opacity duration-300 ease-out"
          style={{ opacity: isHydrated ? 1 : 0 }}
        >
          {isHydrated ? (
            <ProjectsGraphIsland
              dictionary={dictionary}
              projects={projects}
              dustSnapshotRef={dustSnapshotRef}
              onReady={onGraphReady}
            />
          ) : null}
        </div>
      </Slab>

      <Slab
        ref={popupRef}
        variant="slab"
        style={{
          position: "absolute",
          top: "calc(100% + var(--slab-gap))",
          left: 0,
          right: 0,
          marginInline: "auto",
          width: isMobilePopup ? "100%" : "fit-content",
          minWidth: isMobilePopup ? undefined : "min(92vw, 560px)",
          maxWidth: isMobilePopup ? "100%" : "min(92vw, 860px)",
          minHeight: isMobilePopup ? undefined : "360px",
          maxHeight: isMobilePopup ? undefined : "calc(100dvh - 160px)",
          height: "auto",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 30,
        }}
        aria-hidden={!popupOpen}
      >
        <button
          type="button"
          onClick={() => activeApi.clear()}
          aria-label="Close"
          title="Close (Esc)"
          tabIndex={popupOpen ? 0 : -1}
          className="btn-nav absolute right-4 top-4 z-20 h-11 w-11 md:h-[34px] md:w-[34px]"
        >
          <svg
            width={12}
            height={12}
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 2L12 12M12 2L2 12"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div
          ref={popupContentRef}
          className={`relative pb-0 pl-4 pr-4 pt-4 md:pb-0 md:pl-10 md:pr-14 md:pt-10 ${
            isMobilePopup ? "h-auto overflow-visible" : "h-full overflow-y-auto"
          }`}
          style={{ opacity: 0 }}
        >
          {projects.map((project) => (
            <SkillRows
              key={`sizer-${project.id}`}
              project={project}
              isMobilePopup={isMobilePopup}
              mode="sizer"
            />
          ))}
          {activeProject ? (
            <div className="relative flex flex-col gap-5">
              <h3 className="reference-title text-center">
                {activeProject.title}
              </h3>
              <SkillRows
                project={activeProject}
                isMobilePopup={isMobilePopup}
              />
            </div>
          ) : null}
        </div>
      </Slab>

      <FrostField slabRefs={frostRefs} />
    </div>
  );
}
