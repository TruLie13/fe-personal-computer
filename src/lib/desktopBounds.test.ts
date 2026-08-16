import { clampIconPosition } from "@/lib/desktopBounds";

describe("clampIconPosition", () => {
  const icon = { width: 76, height: 64 };
  const desktop = { width: 800, height: 600 };

  it("allows positions inside the desktop", () => {
    expect(clampIconPosition({ x: 100, y: 200 }, icon, desktop)).toEqual({
      x: 100,
      y: 200,
    });
  });

  it("clamps past the right edge", () => {
    expect(clampIconPosition({ x: 900, y: 10 }, icon, desktop)).toEqual({
      x: 724,
      y: 10,
    });
  });

  it("clamps past the bottom edge (taskbar boundary)", () => {
    expect(clampIconPosition({ x: 10, y: 999 }, icon, desktop)).toEqual({
      x: 10,
      y: 536,
    });
  });

  it("clamps negative coordinates to zero", () => {
    expect(clampIconPosition({ x: -20, y: -40 }, icon, desktop)).toEqual({
      x: 0,
      y: 0,
    });
  });
});
