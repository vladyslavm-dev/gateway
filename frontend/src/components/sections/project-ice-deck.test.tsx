import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectIceDeck } from "@/components/sections/project-ice-deck";
import { getDictionary } from "@/lib/i18n";
import { getPlaceholderProjects } from "@/lib/placeholder-content";
import {
  ActiveProjectProvider,
  useActiveProjectApi,
  useActiveProjectId,
} from "@/lib/state/active-project";
import { LAST_SHOWN_PROJECT_KEY } from "@/lib/state/reference-context";
import type { ProjectContent } from "@/lib/site-config.types";

interface ProjectIceCardHandle {
  element: HTMLDivElement | null;
}

const gsapMocks = vi.hoisted(() => ({
  fromTo: vi.fn(),
  killTweensOf: vi.fn(),
  set: vi.fn(),
  to: vi.fn(),
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: gsapMocks.fromTo,
    killTweensOf: gsapMocks.killTweensOf,
    set: gsapMocks.set,
    timeline: () => ({
      to: () => ({
        to: () => ({
          to: gsapMocks.to,
        }),
      }),
    }),
  },
}));

vi.mock("@/components/projects/project-ice-card", () => ({
  ProjectIceCard: React.forwardRef<
    ProjectIceCardHandle,
    {
      project: ProjectContent;
      focal: boolean;
      onActivate: () => void;
    }
  >(function MockProjectIceCard({ project, focal, onActivate }, ref) {
    React.useImperativeHandle(ref, () => ({ element: null }), []);
    return (
      <button
        type="button"
        aria-label={project.title}
        data-focal={String(focal)}
        onClick={onActivate}
      />
    );
  }),
}));

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
}

const originalMatchMedia = window.matchMedia;

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn(
    (query: string) =>
      ({
        media: query,
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

function renderDeck(dictionary: ReturnType<typeof getDictionary>, projects: ProjectContent[]) {
  return render(
    <ActiveProjectProvider>
      <ProjectIceDeck dictionary={dictionary} projects={projects} />
    </ActiveProjectProvider>,
  );
}

function ActiveProjectStatus() {
  const activeProjectId = useActiveProjectId();
  return <output aria-label="Active project">{activeProjectId ?? ""}</output>;
}

function DeckWithActiveProjectStatus({
  dictionary,
  projects,
}: {
  dictionary: ReturnType<typeof getDictionary>;
  projects: ProjectContent[];
}) {
  return (
    <ActiveProjectProvider>
      <ActiveProjectStatus />
      <ProjectIceDeck dictionary={dictionary} projects={projects} />
    </ActiveProjectProvider>
  );
}

function DeckWithActiveProjectControl({
  dictionary,
  projects,
  activeId,
}: {
  dictionary: ReturnType<typeof getDictionary>;
  projects: ProjectContent[];
  activeId: string;
}) {
  const api = useActiveProjectApi();
  return (
    <>
      <button type="button" onClick={() => api.set(activeId)}>
        Set active project
      </button>
      <ProjectIceDeck dictionary={dictionary} projects={projects} />
    </>
  );
}

describe("ProjectIceDeck", () => {
  beforeEach(() => {
    gsapMocks.fromTo.mockClear();
    gsapMocks.to.mockClear();
    window.sessionStorage.clear();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    stubMatchMedia(false);
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
  });

  it("cycles focal cards from nav buttons and arrow keys", () => {
    vi.useFakeTimers();
    const dictionary = getDictionary("en");
    const projects = getPlaceholderProjects("en", dictionary);
    render(
      <DeckWithActiveProjectStatus dictionary={dictionary} projects={projects} />,
    );

    expect(screen.getByRole("button", { name: projects[0].title })).toHaveAttribute(
      "data-focal",
      "true",
    );
    expect(screen.getByLabelText("Active project")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: projects[1].title })).toHaveAttribute(
      "data-focal",
      "true",
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByLabelText("Active project")).toHaveTextContent(projects[1].id);
    expect(window.sessionStorage.getItem(LAST_SHOWN_PROJECT_KEY)).toBe(
      projects[1].id,
    );

    const stage = screen.getAllByRole("region", {
      name: dictionary.sections.cardsEyebrow,
    })[1];
    fireEvent.keyDown(
      stage,
      { key: "ArrowLeft" },
    );
    expect(screen.getByRole("button", { name: projects[0].title })).toHaveAttribute(
      "data-focal",
      "true",
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByLabelText("Active project")).toHaveTextContent(projects[0].id);
    expect(window.sessionStorage.getItem(LAST_SHOWN_PROJECT_KEY)).toBe(
      projects[0].id,
    );
  });

  it("moves focus to a clicked side card without using nav copy", () => {
    vi.useFakeTimers();
    const dictionary = getDictionary("en");
    const projects = getPlaceholderProjects("en", dictionary);
    render(
      <DeckWithActiveProjectStatus dictionary={dictionary} projects={projects} />,
    );
    expect(screen.getByLabelText("Active project")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("button", { name: projects[2].title }));

    expect(screen.getByRole("button", { name: projects[2].title })).toHaveAttribute(
      "data-focal",
      "true",
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByLabelText("Active project")).toHaveTextContent(projects[2].id);
    expect(window.sessionStorage.getItem(LAST_SHOWN_PROJECT_KEY)).toBe(
      projects[2].id,
    );
  });

  it("renders only the focal card on mobile and swaps it from nav", () => {
    stubMatchMedia(true);
    const dictionary = getDictionary("en");
    const projects = getPlaceholderProjects("en", dictionary);
    renderDeck(dictionary, projects);

    expect(screen.getAllByRole("button", { name: /Reference/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: projects[0].title })).toHaveAttribute(
      "data-focal",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getAllByRole("button", { name: /Reference/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: projects[1].title })).toHaveAttribute(
      "data-focal",
      "true",
    );
  });

  it("syncs the focal card to the shared active project", () => {
    const dictionary = getDictionary("en");
    const projects = getPlaceholderProjects("en", dictionary);
    render(
      <ActiveProjectProvider>
        <DeckWithActiveProjectControl
          dictionary={dictionary}
          projects={projects}
          activeId={projects[2].id}
        />
      </ActiveProjectProvider>,
    );

    expect(screen.getByRole("button", { name: projects[0].title })).toHaveAttribute(
      "data-focal",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Set active project" }));

    expect(screen.getByRole("button", { name: projects[2].title })).toHaveAttribute(
      "data-focal",
      "true",
    );
  });
});
