import { describe, expect, it } from "vitest";

import { getDictionary, getSupportedLangs } from "@/lib/i18n";

describe("i18n", () => {
  it("returns fallback English copy for unknown locales", () => {
    expect(getDictionary("fr").hero.name).toBe("Your Name");
  });

  it("returns all supported locales", () => {
    expect(getSupportedLangs()).toEqual(["en", "de"]);
  });
});
