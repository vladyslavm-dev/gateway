import { describe, expect, it } from "vitest";

import { resolveSiteConfig } from "@/lib/site-config.core";

describe("site config", () => {
  it("returns placeholder defaults when placeholder mode is enabled", () => {
    expect(
      resolveSiteConfig({
        PLACEHOLDER_MODE: "true",
      }),
    ).toMatchObject({
      placeholderMode: true,
      siteUrl: "https://example.com",
      contact: {
        email: "name@example.com",
      },
    });
  });

  it("requires production values when placeholder mode is disabled", () => {
    expect(() =>
      resolveSiteConfig({
        PLACEHOLDER_MODE: "false",
        SITE_URL: "https://example.com",
      }),
    ).toThrowError("CONTACT_EMAIL");
  });

  it("uses explicit runtime values when provided", () => {
    expect(
      resolveSiteConfig({
        PLACEHOLDER_MODE: "false",
        SITE_URL: "https://example.com",
        CONTACT_EMAIL: "me@example.com",
        CONTACT_LINKEDIN_URL: "https://linkedin.com/in/example",
        CONTACT_GITHUB_URL: "https://github.com/example",
        LEGAL_FULL_NAME: "Example Person",
        LEGAL_ADDRESS_LINE_1: "Street 1",
        LEGAL_ADDRESS_LINE_2: "12345 City",
        LEGAL_ADDRESS_LINE_3: "c/o Example",
        LEGAL_COUNTRY: "Germany",
        LEGAL_EMAIL: "legal@example.com",
        LEGAL_HOSTING_PROVIDER: "Example Host",
        LEGAL_PROCESSING_LOCATION: "Germany / EU/EEA",
      }),
    ).toMatchObject({
      placeholderMode: false,
      siteUrl: "https://example.com",
      contact: {
        email: "me@example.com",
      },
      legal: {
        fullName: "Example Person",
        addressLine3: "c/o Example",
        email: "legal@example.com",
        hostingProvider: "Example Host",
      },
    });
  });
});
