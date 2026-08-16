import { clampIconPosition } from "@/lib/desktopBounds";

const DROP_ATTR = "data-drop-folder-id";
const DESKTOP_ATTR = "data-desktop-surface";
const DROP_ACTIVE_CLASS = "win-drop-active";

let activeDropElement: HTMLElement | null = null;

export function clearDropTargetHighlight(): void {
  if (activeDropElement) {
    activeDropElement.classList.remove(DROP_ACTIVE_CLASS);
    activeDropElement = null;
  }
}

export function setDropTargetHighlight(element: HTMLElement | null): void {
  if (activeDropElement === element) {
    return;
  }
  clearDropTargetHighlight();
  if (element) {
    element.classList.add(DROP_ACTIVE_CLASS);
    activeDropElement = element;
  }
}

export type FileDropResult =
  | { kind: "folder"; folderId: string; element: HTMLElement }
  | {
      kind: "desktop";
      element: HTMLElement;
      x: number;
      y: number;
    };

function hitTest(clientX: number, clientY: number, dragElement: HTMLElement) {
  const previous = dragElement.style.pointerEvents;
  dragElement.style.pointerEvents = "none";
  const under = document.elementFromPoint(clientX, clientY);
  dragElement.style.pointerEvents = previous;
  return under;
}

/**
 * Find a folder drop target under the pointer.
 * Temporarily disables pointer-events on the dragged icon so hit-testing
 * sees what is beneath it (Win95-style drop onto folder icon / window).
 */
export function resolveFolderDropTarget(
  clientX: number,
  clientY: number,
  dragElement: HTMLElement,
  options?: { excludeFolderId?: string },
): { folderId: string; element: HTMLElement } | null {
  const result = resolveFileDropTarget(clientX, clientY, dragElement, options);
  if (result?.kind === "folder") {
    return { folderId: result.folderId, element: result.element };
  }
  return null;
}

/**
 * Resolve drop onto a folder or the bare desktop surface (not over another window).
 */
export function resolveFileDropTarget(
  clientX: number,
  clientY: number,
  dragElement: HTMLElement,
  options?: { excludeFolderId?: string },
): FileDropResult | null {
  const under = hitTest(clientX, clientY, dragElement);
  if (!under) {
    return null;
  }

  const folderTarget = under.closest(`[${DROP_ATTR}]`);
  if (folderTarget instanceof HTMLElement) {
    const folderId = folderTarget.getAttribute(DROP_ATTR);
    if (!folderId) {
      return null;
    }
    if (options?.excludeFolderId && folderId === options.excludeFolderId) {
      return null;
    }
    return { kind: "folder", folderId, element: folderTarget };
  }

  if (under.closest(".win-window")) {
    return null;
  }

  const desktop = under.closest(`[${DESKTOP_ATTR}]`);
  if (!(desktop instanceof HTMLElement)) {
    return null;
  }

  const rect = desktop.getBoundingClientRect();
  const point = clampIconPosition(
    {
      x: clientX - rect.left - 38,
      y: clientY - rect.top - 20,
    },
    { width: 76, height: 64 },
    { width: desktop.clientWidth, height: desktop.clientHeight },
  );

  return {
    kind: "desktop",
    element: desktop,
    x: point.x,
    y: point.y,
  };
}

export { DROP_ATTR, DESKTOP_ATTR, DROP_ACTIVE_CLASS };
