"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { markPreserveActiveProjectOnNextLoad } from "@/lib/state/reference-context";

type PreservingLinkProps = ComponentProps<typeof Link>;

export function PreservingLink({ onClick, ...props }: PreservingLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        markPreserveActiveProjectOnNextLoad();
        onClick?.(event);
      }}
    />
  );
}
