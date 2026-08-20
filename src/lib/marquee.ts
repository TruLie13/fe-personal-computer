export interface ClientRectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function normalizeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
): ClientRectLike {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

export function rectsIntersect(a: ClientRectLike, b: ClientRectLike): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export function marqueePixelSize(rect: ClientRectLike): {
  width: number;
  height: number;
} {
  return {
    width: Math.max(0, rect.right - rect.left),
    height: Math.max(0, rect.bottom - rect.top),
  };
}

/** Minimum drag distance before a click becomes a marquee selection. */
export const MARQUEE_DRAG_THRESHOLD_PX = 4;

export function pastMarqueeThreshold(
  start: { x: number; y: number },
  current: { x: number; y: number },
  threshold = MARQUEE_DRAG_THRESHOLD_PX,
): boolean {
  return (
    Math.abs(current.x - start.x) >= threshold ||
    Math.abs(current.y - start.y) >= threshold
  );
}
