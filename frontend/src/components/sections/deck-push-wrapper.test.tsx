import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DeckPushRoot,
  DeckPushWrapper,
  useDeckPushSetter,
} from "@/components/sections/deck-push-wrapper";

function PopupHeightProbe() {
  const setPopupH = useDeckPushSetter();
  return (
    <button type="button" onClick={() => setPopupH(180)}>
      set height
    </button>
  );
}

describe("DeckPushWrapper", () => {
  it("bridges popup height into the live spacer size", () => {
    const { container } = render(
      <DeckPushRoot>
        <PopupHeightProbe />
        <DeckPushWrapper />
      </DeckPushRoot>,
    );
    const spacer = container.querySelector(
      "div[aria-hidden='true']",
    ) as HTMLDivElement;

    expect(spacer.style.height).toBe("var(--slab-gap)");

    fireEvent.click(screen.getByRole("button", { name: "set height" }));

    expect(spacer.style.height).toBe("calc(180px + 2 * var(--slab-gap))");
  });
});
