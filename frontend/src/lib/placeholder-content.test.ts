import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n";
import { getLegalLinks, getPlaceholderProjects } from "@/lib/placeholder-content";

describe("placeholder content", () => {
  it("builds four placeholder projects", () => {
    const dictionary = getDictionary("en");
    const projects = getPlaceholderProjects("en", dictionary);

    expect(projects).toHaveLength(4);
    expect(projects[0]?.title).toBe("Reference 01");
    expect(projects[0]?.categories).toHaveLength(5);
    expect(projects[2]?.comingSoon).toBe(true);
    expect(projects[2]?.links).toHaveLength(0);
  });

  it("uses localized placeholder labels", () => {
    const dictionary = getDictionary("de");
    const projects = getPlaceholderProjects("de", dictionary);

    expect(projects[0]?.title).toBe("Referenz 01");
    expect(projects[0]?.categories[0]?.label).toBe("Kategorie 1");
  });

  it("builds localized legal links", () => {
    const dictionary = getDictionary("de");
    expect(getLegalLinks("de", dictionary)).toEqual([
      { label: "Datenschutz", href: "/de/datenschutz" },
      { label: "Impressum", href: "/de/impressum" },
    ]);
  });
});
