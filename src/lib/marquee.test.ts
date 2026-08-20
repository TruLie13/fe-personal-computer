import {
  MARQUEE_DRAG_THRESHOLD_PX,
  normalizeRect,
  pastMarqueeThreshold,
  rectsIntersect,
} from "@/lib/marquee";

describe("marquee", () => {
  it("normalizes a drag rectangle regardless of direction", () => {
    expect(normalizeRect({ x: 10, y: 20 }, { x: 4, y: 8 })).toEqual({
      left: 4,
      top: 8,
      right: 10,
      bottom: 20,
    });
  });

  it("detects intersecting and non-intersecting rects", () => {
    expect(
      rectsIntersect(
        { left: 0, top: 0, right: 10, bottom: 10 },
        { left: 5, top: 5, right: 15, bottom: 15 },
      ),
    ).toBe(true);
    expect(
      rectsIntersect(
        { left: 0, top: 0, right: 10, bottom: 10 },
        { left: 11, top: 0, right: 20, bottom: 10 },
      ),
    ).toBe(false);
  });

  it("requires a drag past the threshold before activating", () => {
    expect(
      pastMarqueeThreshold({ x: 0, y: 0 }, { x: 2, y: 2 }),
    ).toBe(false);
    expect(
      pastMarqueeThreshold(
        { x: 0, y: 0 },
        { x: MARQUEE_DRAG_THRESHOLD_PX, y: 0 },
      ),
    ).toBe(true);
  });
});
