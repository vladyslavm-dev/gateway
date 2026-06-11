"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { FROSTED_PILL_STYLE, ICE_GLASS_STYLE } from "@/components/world/ice-glass";
import { IceCracks } from "@/components/world/ice-cracks";

export type SlabVariant = "slab" | "card" | "button" | "ghost";

export const SLAB_STYLES: Record<SlabVariant, CSSProperties> = {
  slab: ICE_GLASS_STYLE,
  card: ICE_GLASS_STYLE,
  button: FROSTED_PILL_STYLE,
  ghost: {
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(232, 244, 252, 0.32) 100%)",
    border: "1px solid rgba(220, 234, 244, 0.55)",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.65)",
    borderRadius: "9999px",
    position: "relative",
  },
};

type SlabCracks = false | "wide" | "portrait";

// Cracks belong only on large glass slabs; cards/buttons stay clean.
const DEFAULT_CRACKS: Record<SlabVariant, SlabCracks> = {
  slab: "wide",
  card: false,
  button: false,
  ghost: false,
};

const DEFAULT_CRACK_BOOST: Record<SlabVariant, number> = {
  slab: 1,
  card: 1,
  button: 1,
  ghost: 1,
};

interface SlabProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SlabVariant;
  cracks?: SlabCracks;
  crackOpacityBoost?: number;
  children?: ReactNode;
}

export const Slab = forwardRef<HTMLDivElement, SlabProps>(function Slab(
  {
    variant = "slab",
    cracks,
    crackOpacityBoost,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const cracksFinal = cracks ?? DEFAULT_CRACKS[variant];
  const boostFinal = crackOpacityBoost ?? DEFAULT_CRACK_BOOST[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...SLAB_STYLES[variant], ...style }}
      {...rest}
    >
      {cracksFinal !== false ? (
        <IceCracks aspect={cracksFinal} opacityBoost={boostFinal} />
      ) : null}
      {children}
    </div>
  );
});
