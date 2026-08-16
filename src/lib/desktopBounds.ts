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
