"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  saveActiveProjectContext,
  saveLastShownProjectId,
} from "@/lib/state/reference-context";

type Listener = (projectId: string | null) => void;

export type ActiveProjectStore = {
  get: () => string | null;
  set: (next: string | null) => void;
  subscribe: (listener: Listener) => () => void;
};

type GraphReadyContextValue = {
  graphReady: boolean;
  setGraphReady: (ready: boolean) => void;
};

function createStore(initial: string | null = null): ActiveProjectStore {
  let current = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => current,
    set: (next) => {
      if (next === current) {
        return;
      }
      current = next;
      saveActiveProjectContext(next);
      if (next) saveLastShownProjectId(next);
      listeners.forEach((l) => l(current));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const ActiveProjectContext = createContext<ActiveProjectStore | null>(null);
const GraphReadyContext = createContext<GraphReadyContextValue | null>(null);

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [store] = useState<ActiveProjectStore>(() => createStore(null));
  const [graphReady, setGraphReady] = useState(false);
  const graphReadyValue = useMemo(
    () => ({ graphReady, setGraphReady }),
    [graphReady],
  );

  return (
    <ActiveProjectContext.Provider value={store}>
      <GraphReadyContext.Provider value={graphReadyValue}>
        {children}
      </GraphReadyContext.Provider>
    </ActiveProjectContext.Provider>
  );
}

export function useActiveProjectStore(): ActiveProjectStore {
  const store = useContext(ActiveProjectContext);
  if (!store) {
    throw new Error(
      "useActiveProjectStore must be used within ActiveProjectProvider",
    );
  }
  return store;
}

export function useActiveProjectId(): string | null {
  const store = useActiveProjectStore();
  const subscribe = useCallback(
    (onChange: () => void) => store.subscribe(() => onChange()),
    [store],
  );
  const getSnapshot = useCallback(() => store.get(), [store]);
  const getServerSnapshot = useCallback(() => null, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useActiveProjectApi() {
  const store = useActiveProjectStore();
  return useMemo(
    () => ({
      set: (id: string | null) => store.set(id),
      clear: () => store.set(null),
      get: () => store.get(),
      subscribe: (listener: Listener) => store.subscribe(listener),
    }),
    [store],
  );
}

function useGraphReadyContext(): GraphReadyContextValue {
  const value = useContext(GraphReadyContext);
  if (!value) {
    throw new Error(
      "useGraphReadyContext must be used within ActiveProjectProvider",
    );
  }
  return value;
}

export function useGraphReady(): boolean {
  return useGraphReadyContext().graphReady;
}

export function useGraphReadyApi() {
  const { setGraphReady } = useGraphReadyContext();
  return useMemo(
    () => ({
      setGraphReady,
    }),
    [setGraphReady],
  );
}
