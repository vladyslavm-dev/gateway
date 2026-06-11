import type { Metadata } from "next";

import { WorldFrameSurface } from "@/components/world/world-frame-surface";

export const metadata: Metadata = {
  title: "Gateway World Frame",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorldFramePage() {
  return <WorldFrameSurface />;
}
