import { describe, expect, it } from "vitest";

import {
  getAlternateLocalePath,
  getHomePath,
  getLegalPath,
  isLang,
} from "@/lib/routes";

describe("routes", () => {
  it("recognizes supported locales", () => {
    expect(isLang("en")).toBe(true);
    expect(isLang("de")).toBe(true);
    expect(isLang("fr")).toBe(false);
  });

  it("builds localized home paths", () => {
    expect(getHomePath("en")).toBe("/en");
    expect(getHomePath("de")).toBe("/de");
  });

  it("builds localized legal paths", () => {
    expect(getLegalPath("en", "impressum")).toBe("/en/impressum");
    expect(getLegalPath("de", "impressum")).toBe("/de/impressum");
    expect(getLegalPath("en", "dataProtection")).toBe("/en/data-protection");
    expect(getLegalPath("de", "dataProtection")).toBe("/de/datenschutz");
  });

  it("switches locale while preserving the route intent", () => {
    expect(getAlternateLocalePath("de", "/en")).toBe("/de");
    expect(getAlternateLocalePath("de", "/en/impressum")).toBe("/de/impressum");
    expect(getAlternateLocalePath("en", "/de/datenschutz")).toBe(
      "/en/data-protection",
    );
  });
});
