import { describe, expect, it } from "vitest";

import { getDictionary } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/metadata";

describe("metadata", () => {
  it("builds localized home metadata", () => {
    const metadata = buildPageMetadata({
      siteUrl: "https://example.com",
      lang: "en",
      dictionary: getDictionary("en"),
      route: "home",
    });

    expect(metadata.title).toBe("Gateway");
    expect(metadata.alternates?.canonical).toBe("https://example.com/en");
    expect(metadata.openGraph?.url).toBe("https://example.com/en");
  });

  it("builds localized legal alternates", () => {
    const metadata = buildPageMetadata({
      siteUrl: "https://example.com",
      lang: "de",
      dictionary: getDictionary("de"),
      route: "dataProtection",
    });

    expect(metadata.title).toBe("Datenschutz");
    expect(metadata.alternates?.canonical).toBe(
      "https://example.com/de/datenschutz",
    );
    expect(metadata.alternates?.languages).toMatchObject({
      en: "https://example.com/en/data-protection",
      de: "https://example.com/de/datenschutz",
    });
  });
});
