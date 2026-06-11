import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LegalPage } from "@/components/legal/legal-page";
import { getDictionary } from "@/lib/i18n";
import { PRESERVE_PROJECT_ON_NEXT_LOAD_KEY } from "@/lib/state/reference-context";

describe("LegalPage", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("renders the localized legal shell", () => {
    render(
      <LegalPage
        currentLang="de"
        currentPath="/de/impressum"
        dictionary={getDictionary("de")}
        title="Impressum"
        document={{
          sections: [
            {
              title: "Vorlage",
              paragraphs: ["Diese Vorlage enthält kein Impressum."],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Impressum" })).toBeInTheDocument();
    expect(screen.getByText("Diese Vorlage enthält kein Impressum.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /zurück zur startseite/i }),
    ).toHaveAttribute("href", "/de");
  });

  it("uses an English home affordance when lang is en", () => {
    render(
      <LegalPage
        currentLang="en"
        currentPath="/en/impressum"
        dictionary={getDictionary("en")}
        title="Impressum"
        document={{
          sections: [
            {
              title: "Template",
              paragraphs: ["This template does not include a legal notice."],
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toHaveAttribute("href", "/en");
  });

  it("marks the active reference for one-shot preservation before returning home", () => {
    render(
      <LegalPage
        currentLang="en"
        currentPath="/en/data-protection"
        dictionary={getDictionary("en")}
        title="Data Protection"
        document={{
          sections: [
            {
              title: "Privacy template",
              paragraphs: ["This template does not include a privacy policy."],
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: /back to home/i }));

    expect(window.sessionStorage.getItem(PRESERVE_PROJECT_ON_NEXT_LOAD_KEY)).toBe(
      "1",
    );
  });
});
