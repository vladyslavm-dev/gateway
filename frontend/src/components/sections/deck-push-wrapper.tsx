"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface DeckPushCtx {
  popupH: number;
  setPopupH: (h: number) => void;
}

const DeckPushContext = createContext<DeckPushCtx | null>(null);

function useDeckPushContext() {
  const ctx = useContext(DeckPushContext);
  if (!ctx) {
    throw new Error("DeckPush* must be rendered inside <DeckPushRoot>");
  }
  return ctx;
}

export function useDeckPushSetter() {
  return useDeckPushContext().setPopupH;
}

export function DeckPushRoot({ children }: { children: ReactNode }) {
  const [popupH, setPopupH] = useState(0);
  return (
    <DeckPushContext.Provider value={{ popupH, setPopupH }}>
      <div className="relative">{children}</div>
    </DeckPushContext.Provider>
  );
}

export function DeckPushWrapper() {
  const { popupH } = useDeckPushContext();

  return (
    <div
      aria-hidden="true"
      className="transition-[height] duration-300 ease-out"
      style={{
        height:
          popupH > 0
            ? `calc(${popupH}px + 2 * var(--slab-gap))`
            : "var(--slab-gap)",
        flexShrink: 0,
      }}
    />
  );
}
