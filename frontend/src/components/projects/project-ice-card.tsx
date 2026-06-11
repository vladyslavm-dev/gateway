"use client";

import { gsap } from "gsap";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";

import { GitHubIcon, YouTubeIcon } from "@/components/layout/icons";
import { SLAB_STYLES, Slab } from "@/components/world/slab";
import type {
  ProjectCardLink,
  ProjectContent,
} from "@/lib/site-config.types";

interface ProjectIceCardProps {
  project: ProjectContent;
  comingSoonLabel?: string;
  focal?: boolean;
  mobile?: boolean;
  transitioning?: boolean;
  sizer?: boolean;
  onActivate?: () => void;
}

export interface ProjectIceCardHandle {
  element: HTMLDivElement | null;
}

const FOCAL_CARD_STYLE: CSSProperties = {
  background: [
    "radial-gradient(ellipse 68% 58% at 50% 0%, rgba(210, 255, 255, 0.20) 0%, rgba(118, 226, 236, 0.10) 44%, transparent 82%)",
    "radial-gradient(circle 45% 62% at 0% 0%, rgba(181, 250, 255, 0.16) 0%, transparent 78%)",
    "radial-gradient(circle 45% 62% at 100% 0%, rgba(181, 250, 255, 0.14) 0%, transparent 78%)",
    "linear-gradient(180deg, rgba(52, 194, 205, 0.25) 0%, rgba(40, 176, 190, 0.15) 55%, rgba(22, 123, 148, 0.16) 100%)",
  ].join(", "),
  border: "1px solid rgba(218, 255, 255, 0.40)",
  boxShadow:
    "0 18px 34px rgba(8, 84, 105, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.58), inset 0 -1px 0 rgba(70, 190, 205, 0.18)",
  backdropFilter: "blur(4px) saturate(108%)",
  WebkitBackdropFilter: "blur(4px) saturate(108%)",
};

const SIDE_CARD_STYLE: CSSProperties = {
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  background: [
    "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(210, 255, 255, 0.14) 0%, rgba(92, 220, 230, 0.06) 50%, transparent 85%)",
    "linear-gradient(180deg, rgba(44, 190, 203, 0.18) 0%, rgba(32, 154, 176, 0.12) 100%)",
  ].join(", "),
  border: "1px solid rgba(220, 255, 255, 0.30)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.36), inset 0 -1px 0 rgba(70, 190, 205, 0.12)",
};

const MOTION_CARD_STYLE: CSSProperties = {
  background: [
    "radial-gradient(ellipse 68% 58% at 50% 0%, rgba(212, 255, 255, 0.24) 0%, rgba(92, 224, 234, 0.13) 46%, transparent 84%)",
    "radial-gradient(circle 46% 62% at 0% 0%, rgba(185, 250, 255, 0.16) 0%, transparent 78%)",
    "radial-gradient(circle 46% 62% at 100% 0%, rgba(185, 250, 255, 0.14) 0%, transparent 78%)",
    "linear-gradient(180deg, rgba(48, 194, 205, 0.31) 0%, rgba(36, 172, 188, 0.22) 58%, rgba(20, 125, 150, 0.20) 100%)",
  ].join(", "),
  border: "1px solid rgba(218, 255, 255, 0.42)",
  boxShadow:
    "0 14px 28px rgba(8, 84, 105, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.54), inset 0 -1px 0 rgba(70, 190, 205, 0.18)",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const ProjectIceCard = forwardRef<
  ProjectIceCardHandle,
  ProjectIceCardProps
>(function ProjectIceCard(
  {
    project,
    comingSoonLabel = "Coming soon",
    focal = false,
    mobile = false,
    transitioning = false,
    sizer = false,
    onActivate,
  },
  ref,
) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => ({ element: elementRef.current }), []);

  const handleClick = () => {
    if (!focal) onActivate?.();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!focal) onActivate?.();
    }
  };

  const cardStyle: CSSProperties = sizer
    ? {
        width: "var(--ice-card-w)",
        minHeight: 0,
        height: "auto",
        padding: "var(--card-pad-y) 22px",
        ...SIDE_CARD_STYLE,
      }
    : {
        width: "var(--ice-card-w)",
        minHeight: "var(--ice-card-h)",
        height: mobile ? "auto" : "var(--ice-card-h)",
        padding: "var(--card-pad-y) 22px",
        ...(focal
          ? transitioning && !mobile
            ? MOTION_CARD_STYLE
            : FOCAL_CARD_STYLE
          : SIDE_CARD_STYLE),
      };
  const hasPreviewImage = Boolean(project.imageBasePath);

  return (
    <Slab
      ref={elementRef}
      variant="card"
      data-ice-card
      data-focal={focal}
      data-sizer={sizer ? "true" : undefined}
      role="group"
      aria-label={project.title}
      aria-roledescription="Project ice card"
      aria-current={focal ? "true" : undefined}
      tabIndex={focal ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={cardStyle}
      className="ice-card cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
    >
      <div
        className={
          sizer
            ? "relative grid grid-rows-[auto_auto] gap-4"
            : mobile
              ? "relative grid grid-rows-[auto_auto] gap-4"
              : "relative grid h-full grid-rows-[auto_minmax(0,1fr)] gap-4"
        }
      >
        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{
            aspectRatio: "16 / 9",
            background:
              "linear-gradient(160deg, rgba(38, 70, 100, 0.55) 0%, rgba(20, 50, 80, 0.62) 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(255, 255, 255, 0.10), inset 0 -1px 0 rgba(0, 0, 0, 0.18)",
          }}
        >
          {hasPreviewImage && !sizer ? (
            <img
              src={`${project.imageBasePath}/card.webp`}
              alt={project.imageAlt}
              width={960}
              height={540}
              decoding="async"
              loading="eager"
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              role="img"
              aria-label={project.imageAlt || project.title}
              className="h-full w-full"
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, transparent 0%, transparent 55%, rgba(8, 24, 40, 0.35) 100%)",
            }}
          />
        </div>

        {project.comingSoon ? (
          <span className="absolute right-4 top-4 z-20 rounded-full border border-cyan-100/30 bg-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-50/85 backdrop-blur-[2px]">
            {comingSoonLabel}
          </span>
        ) : null}

        <div className="ice-card__body relative flex min-h-0 flex-col items-center gap-2.5 px-2 text-center transition-opacity duration-300">
          <h3 className="reference-title max-w-full [text-wrap:balance]">
            {project.title}
          </h3>
          <p
            className={
              mobile
                ? "reference-summary mx-auto min-h-0 max-w-[34ch] [text-wrap:balance]"
                : "reference-summary mx-auto min-h-0 max-w-[34ch] [text-wrap:balance]"
            }
          >
            {project.summary}
          </p>
          <div
            className={
              mobile
                ? "mt-auto flex flex-wrap items-center justify-center gap-3 pt-[16px]"
                : "mt-auto flex flex-wrap items-center justify-center gap-3 pt-[18px]"
            }
          >
            {project.links.length > 0 ? (
              project.links.map((link) => (
                <IceLinkButton
                  key={`${project.id}-${link.kind}`}
                  link={link}
                  enabled={focal}
                />
              ))
            ) : (
              <span
                className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-700/80"
                style={SLAB_STYLES.ghost}
              >
                {comingSoonLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </Slab>
  );
});

interface IceLinkButtonProps {
  link: ProjectCardLink;
  enabled: boolean;
}

function runIcePop(el: HTMLElement) {
  gsap
    .timeline({ overwrite: "auto" })
    .to(el, { scale: 0.94, duration: 0.07, ease: "power2.out" })
    .to(el, { scale: 1.04, duration: 0.18, ease: "back.out(2.5)" })
    .to(el, { scale: 1.0, duration: 0.12, ease: "power2.out" });
}

function IceLinkIcon({ kind }: { kind: ProjectCardLink["kind"] }) {
  switch (kind) {
    case "repository":
      return <GitHubIcon className="h-7 w-7" aria-hidden="true" />;
    case "video":
      return <YouTubeIcon className="h-7 w-7" aria-hidden="true" />;
    case "demo":
    default:
      return (
        <img
          src="/icon.svg"
          alt=""
          aria-hidden="true"
          className="h-6 w-6"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      );
  }
}

function IceLinkButton({ link, enabled }: IceLinkButtonProps) {
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    if (!enabled) {
      event.preventDefault();
      return;
    }
    if (anchorRef.current) runIcePop(anchorRef.current);
  };

  return (
    <a
      ref={anchorRef}
      href={link.href}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      tabIndex={enabled ? 0 : -1}
      aria-label={link.label}
      title={link.label}
      className="btn-nav btn-nav--icon"
    >
      <IceLinkIcon kind={link.kind} />
    </a>
  );
}
