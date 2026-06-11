"use client";

import { useCallback } from "react";

import { GraphStageSlabs } from "@/components/world/graph-stage-slabs";
import { useDeckPushSetter } from "@/components/sections/deck-push-wrapper";
import { useGraphReadyApi } from "@/lib/state/active-project";
import type {
  LocaleDictionary,
  ProjectContent,
} from "@/lib/site-config.types";

interface Props {
  dictionary: LocaleDictionary;
  projects: ProjectContent[];
}

// Keeps function props on the client side of the RSC boundary.
export function GraphStageSlabsPushClient(props: Props) {
  const setPopupH = useDeckPushSetter();
  const { setGraphReady } = useGraphReadyApi();
  const onGraphReady = useCallback(() => {
    setGraphReady(true);
  }, [setGraphReady]);

  return (
    <GraphStageSlabs
      {...props}
      onPopupHeightChange={setPopupH}
      onGraphReady={onGraphReady}
    />
  );
}
