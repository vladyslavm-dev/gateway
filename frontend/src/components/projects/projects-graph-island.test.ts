import { describe, expect, it } from "vitest";

import {
  getGraphLayoutConfig,
  measureLabelPad,
} from "@/components/projects/projects-graph-island";

describe("projects graph layout config", () => {
  it("uses a compact single-source config for mobile labels and spacing", () => {
    const desktop = getGraphLayoutConfig(false);
    const mobile = getGraphLayoutConfig(true);

    expect(desktop.labels.project.fontSize).toBe(11);
    expect(mobile.labels.project.fontSize).toBe(10);
    expect(mobile.labels.category.fontSize).toBe(9);
    expect(mobile.labels.skill.fontSize).toBe(8);
    expect(mobile.categoryOffset).toBe(80);
    expect(mobile.skillOffset).toBe(36);

    const desktopPad = measureLabelPad("project", "REFERENCE 01", 14, desktop.labels);
    const mobilePad = measureLabelPad("project", "REFERENCE 01", 14, mobile.labels);
    expect(mobilePad.padX).toBeLessThan(desktopPad.padX);
    expect(mobilePad.padBottom).toBeLessThan(desktopPad.padBottom);
  });
});
