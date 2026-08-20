import {
  DEFAULT_ICONS,
  findOpenDesktopSlot,
  ICON_SLOT_HEIGHT,
  ICON_SLOT_WIDTH,
  mergeAppIcons,
  nextDesktopIconPosition,
  PROFILE_ICON_POSITION,
} from "@/lib/storage";
import type { DesktopIcon } from "@/types/desktop";

describe("desktop icon placement", () => {
  it("keeps default app icons from overlapping each other", () => {
    for (let i = 0; i < DEFAULT_ICONS.length; i += 1) {
      for (let j = i + 1; j < DEFAULT_ICONS.length; j += 1) {
        const a = DEFAULT_ICONS[i]!;
        const b = DEFAULT_ICONS[j]!;
        const overlaps =
          Math.abs(a.x - b.x) < ICON_SLOT_WIDTH &&
          Math.abs(a.y - b.y) < ICON_SLOT_HEIGHT;
        expect(overlaps).toBe(false);
      }
    }
  });

  it("places a newly introduced app away from an occupied default slot", () => {
    const priorNetwork: DesktopIcon = {
      id: "network-neighborhood",
      label: "Network Neighborhood",
      type: "network",
      x: 116,
      y: 112,
    };
    const withoutStory = DEFAULT_ICONS.filter(
      (icon) => icon.id !== "story-explorer",
    ).map((icon) =>
      icon.id === "network-neighborhood" ? priorNetwork : icon,
    );

    const merged = mergeAppIcons(withoutStory);
    const story = merged.find((icon) => icon.id === "story-explorer");
    const network = merged.find((icon) => icon.id === "network-neighborhood");

    expect(story).toBeDefined();
    expect(network).toBeDefined();
    expect(
      Math.abs(story!.x - network!.x) < ICON_SLOT_WIDTH &&
        Math.abs(story!.y - network!.y) < ICON_SLOT_HEIGHT,
    ).toBe(false);
  });

  it("findOpenDesktopSlot prefers the requested point when free", () => {
    expect(findOpenDesktopSlot([], { x: 116, y: 112 })).toEqual({
      x: 116,
      y: 112,
    });
  });

  it("findOpenDesktopSlot skips occupied preferred points", () => {
    const slot = findOpenDesktopSlot([{ x: 116, y: 112 }], {
      x: 116,
      y: 112,
    });
    expect(slot).not.toEqual({ x: 116, y: 112 });
    expect(
      Math.abs(slot.x - 116) < ICON_SLOT_WIDTH &&
        Math.abs(slot.y - 112) < ICON_SLOT_HEIGHT,
    ).toBe(false);
  });

  it("places new files away from existing app icons", () => {
    const slot = nextDesktopIconPosition(DEFAULT_ICONS, "file");
    for (const app of DEFAULT_ICONS) {
      const overlaps =
        Math.abs(slot.x - app.x) < ICON_SLOT_WIDTH &&
        Math.abs(slot.y - app.y) < ICON_SLOT_HEIGHT;
      expect(overlaps).toBe(false);
    }
  });

  it("keeps the profile computer icon pinned top-left", () => {
    const moved: DesktopIcon = {
      id: "profile",
      label: "Writer's PC",
      type: "profile",
      x: 200,
      y: 300,
    };
    const merged = mergeAppIcons([
      moved,
      ...DEFAULT_ICONS.filter((icon) => icon.id !== "profile"),
    ]);
    const profile = merged.find((icon) => icon.type === "profile");
    expect(profile?.x).toBe(PROFILE_ICON_POSITION.x);
    expect(profile?.y).toBe(PROFILE_ICON_POSITION.y);
  });
});
