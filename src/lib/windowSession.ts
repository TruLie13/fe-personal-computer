import type { DesktopIcon, DesktopWindow, WindowType } from "@/types/desktop";
import { countsTowardOpenDocumentCap } from "@/lib/windowKinds";

export const WINDOW_SESSION_STORAGE_KEY =
  "personal-computer-window-session-v1";

export interface WindowSessionState {
  windows: DesktopWindow[];
  documentWindowFifo: string[];
  nextZIndex: number;
}

const WINDOW_TYPES = new Set<WindowType>([
  "about",
  "folder",
  "text",
  "system",
  "editor",
  "display",
  "bbs",
  "network",
  "stories",
  "profile",
]);

function isDesktopWindow(value: unknown): value is DesktopWindow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as DesktopWindow;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    WINDOW_TYPES.has(item.type) &&
    typeof item.iconId === "string" &&
    (item.documentId === null || typeof item.documentId === "string") &&
    typeof item.isOpen === "boolean" &&
    typeof item.isFocused === "boolean" &&
    typeof item.isMinimized === "boolean" &&
    typeof item.x === "number" &&
    Number.isFinite(item.x) &&
    typeof item.y === "number" &&
    Number.isFinite(item.y) &&
    typeof item.width === "number" &&
    Number.isFinite(item.width) &&
    typeof item.height === "number" &&
    Number.isFinite(item.height) &&
    typeof item.zIndex === "number" &&
    Number.isFinite(item.zIndex)
  );
}

function sanitizeSession(
  windows: DesktopWindow[],
  fifo: string[],
  nextZIndex: number,
  icons: ReadonlyArray<DesktopIcon> | null,
): WindowSessionState {
  const iconIds = icons ? new Set(icons.map((icon) => icon.id)) : null;
  const kept = windows.filter((item) => {
    if (iconIds && !iconIds.has(item.iconId) && item.type !== "editor") {
      return false;
    }
    return true;
  });
  const openIds = new Set(
    kept
      .filter(
        (item) =>
          item.isOpen && countsTowardOpenDocumentCap(item.type),
      )
      .map((item) => item.id),
  );
  const documentWindowFifo = fifo.filter((id) => openIds.has(id));
  for (const id of openIds) {
    if (!documentWindowFifo.includes(id)) {
      documentWindowFifo.push(id);
    }
  }
  return {
    windows: kept,
    documentWindowFifo,
    nextZIndex: Math.max(1, Math.floor(nextZIndex)),
  };
}

export function loadWindowSession(
  icons: ReadonlyArray<DesktopIcon> | null = null,
): WindowSessionState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WINDOW_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const data = parsed as Partial<WindowSessionState>;
    if (!Array.isArray(data.windows) || typeof data.nextZIndex !== "number") {
      return null;
    }
    const windows = data.windows.filter(isDesktopWindow);
    const fifo = Array.isArray(data.documentWindowFifo)
      ? data.documentWindowFifo.filter(
          (id): id is string => typeof id === "string",
        )
      : [];
    return sanitizeSession(windows, fifo, data.nextZIndex, icons);
  } catch {
    return null;
  }
}

export function saveWindowSession(state: WindowSessionState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: WindowSessionState = {
      windows: state.windows.map((item) => ({
        ...item,
        // Don't restore as visiting-focused noise; hydrate will fix focus.
        isFocused: item.isOpen && item.isFocused,
      })),
      documentWindowFifo: state.documentWindowFifo,
      nextZIndex: state.nextZIndex,
    };
    window.localStorage.setItem(
      WINDOW_SESSION_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Quota / private mode — ignore
  }
}

export function clearWindowSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(WINDOW_SESSION_STORAGE_KEY);
}
