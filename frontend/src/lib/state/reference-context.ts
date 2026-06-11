export const LAST_SHOWN_PROJECT_KEY = "gateway:last-random-project-id";
export const ACTIVE_PROJECT_CONTEXT_KEY = "gateway:active-project-id";
export const PRESERVE_PROJECT_ON_NEXT_LOAD_KEY =
  "gateway:preserve-active-project-on-next-load";

export function saveActiveProjectContext(projectId: string | null) {
  if (typeof window === "undefined") return;

  try {
    if (projectId) {
      window.sessionStorage.setItem(ACTIVE_PROJECT_CONTEXT_KEY, projectId);
    } else {
      window.sessionStorage.removeItem(ACTIVE_PROJECT_CONTEXT_KEY);
    }
  } catch {
    // Storage can be disabled; the in-memory active project store still works.
  }
}

export function markPreserveActiveProjectOnNextLoad() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(PRESERVE_PROJECT_ON_NEXT_LOAD_KEY, "1");
  } catch {
    // Navigation should never depend on storage availability.
  }
}

export function consumePreservedActiveProjectId() {
  if (typeof window === "undefined") return null;

  try {
    const preserve = window.sessionStorage.getItem(
      PRESERVE_PROJECT_ON_NEXT_LOAD_KEY,
    );
    const active = window.sessionStorage.getItem(ACTIVE_PROJECT_CONTEXT_KEY);
    window.sessionStorage.removeItem(PRESERVE_PROJECT_ON_NEXT_LOAD_KEY);
    return preserve === "1" ? active : null;
  } catch {
    return null;
  }
}

export function readLastShownProjectId() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(LAST_SHOWN_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function saveLastShownProjectId(projectId: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(LAST_SHOWN_PROJECT_KEY, projectId);
  } catch {
    // No-repeat fallback still works without persistence.
  }
}
