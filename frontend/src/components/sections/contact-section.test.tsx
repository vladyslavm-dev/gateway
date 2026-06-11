import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ContactSection } from "@/components/sections/contact-section";
import { getDictionary } from "@/lib/i18n";
import { resolveSiteConfig } from "@/lib/site-config.core";
import { PRESERVE_PROJECT_ON_NEXT_LOAD_KEY } from "@/lib/state/reference-context";

describe("ContactSection", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("renders the 3 glass icon buttons and quiet legal links (en)", () => {
    render(
      <ContactSection
        currentLang="en"
        dictionary={getDictionary("en")}
        siteConfig={resolveSiteConfig({ PLACEHOLDER_MODE: "true" })}
      />,
    );

    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      "mailto:name@example.com",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://linkedin.com/",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/",
    );
    expect(screen.getByRole("link", { name: "Data Protection" })).toHaveAttribute(
      "href",
      "/en/data-protection",
    );
    expect(screen.getByRole("link", { name: "Impressum" })).toHaveAttribute(
      "href",
      "/en/impressum",
    );
  });

  it("does not render any filler contact headline in either locale", () => {
    const { unmount } = render(
      <ContactSection
        currentLang="de"
        dictionary={getDictionary("de")}
        siteConfig={resolveSiteConfig({ PLACEHOLDER_MODE: "true" })}
      />,
    );
    expect(
      screen.queryByText(/Allgemeiner Kontakt und rechtliche Zugänge\.?/i),
    ).not.toBeInTheDocument();
    unmount();

    render(
      <ContactSection
        currentLang="en"
        dictionary={getDictionary("en")}
        siteConfig={resolveSiteConfig({ PLACEHOLDER_MODE: "true" })}
      />,
    );
    expect(
      screen.queryByText(/General contact and legal access\.?/i),
    ).not.toBeInTheDocument();
  });

  it("marks the active reference for one-shot preservation before opening legal links", () => {
    render(
      <ContactSection
        currentLang="en"
        dictionary={getDictionary("en")}
        siteConfig={resolveSiteConfig({ PLACEHOLDER_MODE: "true" })}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Data Protection" }));

    expect(window.sessionStorage.getItem(PRESERVE_PROJECT_ON_NEXT_LOAD_KEY)).toBe(
      "1",
    );
  });
});
