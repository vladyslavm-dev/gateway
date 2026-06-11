import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProjectIceCard } from "@/components/projects/project-ice-card";
import type { ProjectContent } from "@/lib/site-config.types";

vi.mock("gsap", () => ({
  gsap: {
    timeline: () => ({
      to: () => ({
        to: () => ({
          to: vi.fn(),
        }),
      }),
    }),
  },
}));

const project: ProjectContent = {
  id: "gateway",
  title: "Gateway",
  summary: "Reference system",
  imageAlt: "Preview",
  imageBasePath: "/projects/gateway",
  links: [
    {
      kind: "repository",
      label: "Repository",
      href: "https://example.com/repo",
    },
    {
      kind: "video",
      label: "Video",
      href: "https://example.com/video",
    },
  ],
  categories: [],
};

describe("ProjectIceCard", () => {
  it("activates only from a non-focal card surface", () => {
    const onActivate = vi.fn();
    const { rerender } = render(
      <ProjectIceCard project={project} focal={false} onActivate={onActivate} />,
    );

    fireEvent.click(screen.getByRole("group", { name: project.title }));
    expect(onActivate).toHaveBeenCalledTimes(1);

    rerender(
      <ProjectIceCard project={project} focal={true} onActivate={onActivate} />,
    );
    fireEvent.click(screen.getByRole("group", { name: project.title }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("keeps non-focal links out of tab order and prevents navigation", () => {
    const onActivate = vi.fn();
    render(
      <ProjectIceCard project={project} focal={false} onActivate={onActivate} />,
    );

    const repository = screen.getByRole("link", { name: "Repository" });
    expect(repository).toHaveAttribute("tabindex", "-1");
    expect(fireEvent.click(repository)).toBe(false);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("enables focal project links without bubbling into card activation", () => {
    const onActivate = vi.fn();
    render(
      <ProjectIceCard project={project} focal={true} onActivate={onActivate} />,
    );

    const repository = screen.getByRole("link", { name: "Repository" });
    expect(repository).toHaveAttribute("tabindex", "0");
    expect(repository).toHaveAttribute("href", project.links[0].href);
    expect(fireEvent.click(repository)).toBe(true);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("marks hidden measurement cards so mobile CSS keeps them measurable", () => {
    render(<ProjectIceCard project={project} sizer />);

    const card = screen.getByRole("group", { name: project.title });
    expect(card).toHaveAttribute("data-focal", "false");
    expect(card).toHaveAttribute("data-sizer", "true");
  });
});
