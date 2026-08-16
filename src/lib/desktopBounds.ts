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

const TASKBAR_HEIGHT = 28;

/** Center a window in the visible desktop (viewport minus taskbar). */
export function centeredWindowPosition(
  windowSize: Size,
  viewport?: Size,
): Point {
  const width =
    viewport?.width ??
    (typeof window !== "undefined" ? window.innerWidth : 1024);
  const height =
    viewport?.height ??
    (typeof window !== "undefined" ? window.innerHeight : 768);
  const desktop: Size = {
    width,
    height: Math.max(0, height - TASKBAR_HEIGHT),
  };
  return clampIconPosition(
    {
      x: Math.round((desktop.width - windowSize.width) / 2),
      y: Math.round((desktop.height - windowSize.height) / 2),
    },
    windowSize,
    desktop,
  );
}
