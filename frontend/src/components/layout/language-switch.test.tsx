import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LanguageSwitch } from "@/components/layout/language-switch";
import { PRESERVE_PROJECT_ON_NEXT_LOAD_KEY } from "@/lib/state/reference-context";

describe("LanguageSwitch", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("renders locale links, marks active, and exposes aria-label", () => {
    render(
      <LanguageSwitch
        currentLang="en"
        currentPath="/en/data-protection"
        ariaLabel="Language"
      />,
    );

    expect(
      screen.getByRole("group", { name: "Language" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute(
      "href",
      "/en/data-protection",
    );
    expect(screen.getByRole("link", { name: "DE" })).toHaveAttribute(
      "href",
      "/de/datenschutz",
    );
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks DE as active when currentLang is de", () => {
    render(
      <LanguageSwitch
        currentLang="de"
        currentPath="/de"
        ariaLabel="Sprache"
      />,
    );

    expect(screen.getByRole("link", { name: "DE" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "EN" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the active reference for one-shot preservation before switching", () => {
    render(
      <LanguageSwitch
        currentLang="en"
        currentPath="/en"
        ariaLabel="Language"
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "DE" }));

    expect(window.sessionStorage.getItem(PRESERVE_PROJECT_ON_NEXT_LOAD_KEY)).toBe(
      "1",
    );
  });
});
