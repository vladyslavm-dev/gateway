"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { LoadingScrim } from "@/components/world/loading-scrim";
import { registerScroll } from "@/lib/motion/scroll";
import {
  ActiveProjectProvider,
  useGraphReady,
  useGraphReadyApi,
} from "@/lib/state/active-project";

const LEGAL_PATTERNS = [
  /\/impressum(\/|$)/,
  /\/data-protection(\/|$)/,
  /\/datenschutz(\/|$)/,
];

function logReadinessProbe(label: string) {
  if (typeof window === "undefined") {
    return;
  }
  if (!new URLSearchParams(window.location.search).has("probe")) {
    return;
  }
  console.log(`[gateway:probe] ${label}`, Math.round(performance.now()));
}

function isLegalPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  return LEGAL_PATTERNS.some((pattern) => pattern.test(pathname));
}

function getDocumentLang(pathname: string | null): "de" | "en" {
  return pathname?.startsWith("/de") ? "de" : "en";
}

export function WorldRoot({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ActiveProjectProvider>
      <WorldRootInner>{children}</WorldRootInner>
    </ActiveProjectProvider>
  );
}

function WorldRootInner({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const subdued = isLegalPath(pathname);
  const graphReady = useGraphReady();
  const { setGraphReady } = useGraphReadyApi();
  const pageBackground = subdued ? "#091420" : "#2eb4c0";
  const graphLoggedRef = useRef(false);

  useEffect(() => {
    document.documentElement.lang = getDocumentLang(pathname);
  }, [pathname]);

  useEffect(() => {
    registerScroll();
  }, []);

  useEffect(() => {
    if (subdued || graphReady || typeof window === "undefined") {
      return;
    }

    // Safety net for a graph measurement/render failure.
    const timeoutId = window.setTimeout(() => {
      logReadinessProbe("graphFallbackAt");
      setGraphReady(true);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [graphReady, setGraphReady, subdued]);

  useEffect(() => {
    if (subdued || !graphReady || graphLoggedRef.current) {
      return;
    }
    graphLoggedRef.current = true;
    logReadinessProbe("graphReadyAt");
  }, [graphReady, subdued]);

  return (
    <>
      <style>{`:root:root{--background:${pageBackground};}`}</style>
      {subdued ? (
        <div className="world-content world-content--legal">{children}</div>
      ) : (
        <WorldExperience pathname={pathname} graphReady={graphReady}>
          {children}
        </WorldExperience>
      )}
    </>
  );
}

function WorldExperience({
  children,
  pathname,
  graphReady,
}: {
  children: ReactNode;
  pathname: string | null;
  graphReady: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const sceneReady = frameReady && graphReady;
  const frameSrc = "/world-frame/";
  const frameLoggedRef = useRef(false);
  const sceneLoggedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === frameRef.current?.contentWindow &&
        event.data?.type === "gateway:world-frame-ready"
      ) {
        setFrameReady(true);
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (frameReady || typeof window === "undefined") {
      return;
    }

    // Safety net for failed iframe/shader boot.
    const timeoutId = window.setTimeout(() => {
      logReadinessProbe("frameFallbackAt");
      setFrameReady(true);
    }, 3500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [frameReady]);

  useEffect(() => {
    if (!frameReady || frameLoggedRef.current) {
      return;
    }
    frameLoggedRef.current = true;
    logReadinessProbe("frameReadyAt");
  }, [frameReady]);

  useEffect(() => {
    if (!sceneReady || sceneLoggedRef.current) {
      return;
    }
    sceneLoggedRef.current = true;
    logReadinessProbe("sceneReadyAt");
  }, [sceneReady]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let rafId = 0;
    const pointer = {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    };

    const post = () => {
      rafId = 0;
      const doc = document.documentElement;
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      frameRef.current?.contentWindow?.postMessage(
        {
          type: "gateway:world-frame-input",
          path: pathname,
          pointer,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          scroll: {
            y: window.scrollY,
            max: maxScroll,
            progress: Math.min(Math.max(window.scrollY / maxScroll, 0), 1),
          },
        },
        window.location.origin,
      );
    };

    const schedule = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(post);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return (
    <>
      <div aria-hidden className="world-backdrop">
        <iframe
          ref={frameRef}
          className="world-frame"
          src={frameSrc}
          style={{ opacity: frameReady ? 1 : 0 }}
          title=""
          tabIndex={-1}
        />
      </div>
      <LoadingScrim visible={!sceneReady} />
      <div
        className="world-content"
        style={{ pointerEvents: sceneReady ? "auto" : "none" }}
      >
        {children}
      </div>
    </>
  );
}
