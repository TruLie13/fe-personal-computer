import { DEFAULT_TASKBAR_HEIGHT } from "@/lib/storage";

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Keep an icon fully inside the desktop surface (above the taskbar). */
export function clampIconPosition(
  point: Point,
  icon: Size,
  desktop: Size,
): Point {
  const maxX = Math.max(0, desktop.width - icon.width);
  const maxY = Math.max(0, desktop.height - icon.height);

  return {
    x: Math.min(maxX, Math.max(0, point.x)),
    y: Math.min(maxY, Math.max(0, point.y)),
  };
}

/** Visible desktop surface above the taskbar. */
export function desktopContentSize(
  taskbarHeight: number = DEFAULT_TASKBAR_HEIGHT,
  viewport?: Size,
): Size {
  const width =
    viewport?.width ??
    (typeof window !== "undefined" ? window.innerWidth : 1024);
  const height =
    viewport?.height ??
    (typeof window !== "undefined" ? window.innerHeight : 768);
  return {
    width: Math.max(0, Math.floor(width)),
    height: Math.max(0, Math.floor(height - taskbarHeight)),
  };
}

/** Full-bleed window bounds for a maximized app (above the taskbar). */
export function maximizedWindowBounds(
  taskbarHeight: number = DEFAULT_TASKBAR_HEIGHT,
  viewport?: Size,
): { x: number; y: number; width: number; height: number } {
  const desktop = desktopContentSize(taskbarHeight, viewport);
  return {
    x: 0,
    y: 0,
    width: desktop.width,
    height: desktop.height,
  };
}

/** Center a window in the visible desktop (viewport minus taskbar). */
export function centeredWindowPosition(
  windowSize: Size,
  viewport?: Size,
  taskbarHeight: number = DEFAULT_TASKBAR_HEIGHT,
): Point {
  const desktop = desktopContentSize(taskbarHeight, viewport);
  return clampIconPosition(
    {
      x: Math.round((desktop.width - windowSize.width) / 2),
      y: Math.round((desktop.height - windowSize.height) / 2),
    },
    windowSize,
    desktop,
  );
}

/**
 * Keep a window on-screen: shrink if taller/wider than the desktop, then clamp.
 * Fixes cascaded windows opening entirely below the fold (taskbar shows them,
 * but `overflow:hidden` on the desktop clips them).
 */
export function fitWindowInDesktop(
  position: Point,
  size: Size,
  taskbarHeight: number = DEFAULT_TASKBAR_HEIGHT,
  viewport?: Size,
): { x: number; y: number; width: number; height: number } {
  const desktop = desktopContentSize(taskbarHeight, viewport);
  const width = Math.min(size.width, Math.max(200, desktop.width));
  const height = Math.min(size.height, Math.max(160, desktop.height));
  const fitted = { width, height };
  const pos = clampIconPosition(position, fitted, desktop);
  return { ...pos, ...fitted };
}
