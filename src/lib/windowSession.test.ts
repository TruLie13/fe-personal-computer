import {
  DEFAULT_ICONS,
} from "@/lib/storage";
import {
  WINDOW_SESSION_STORAGE_KEY,
  loadWindowSession,
  saveWindowSession,
} from "@/lib/windowSession";
import type { DesktopWindow } from "@/types/desktop";

const sampleWindow: DesktopWindow = {
  id: "w1",
  title: "Untitled - Notepad",
  type: "editor",
  iconId: "notepad",
  documentId: null,
  isOpen: true,
  isFocused: true,
  isMinimized: false,
  isMaximized: false,
  x: 40,
  y: 60,
  width: 480,
  height: 360,
  zIndex: 2,
};

describe("windowSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and loads window positions", () => {
    saveWindowSession({
      windows: [sampleWindow],
      documentWindowFifo: ["w1"],
      nextZIndex: 3,
    });

    const loaded = loadWindowSession(DEFAULT_ICONS);
    expect(loaded?.windows[0]).toEqual(
      expect.objectContaining({
        id: "w1",
        x: 40,
        y: 60,
        isOpen: true,
      }),
    );
    expect(loaded?.documentWindowFifo).toEqual(["w1"]);
    expect(loaded?.nextZIndex).toBe(3);
    expect(window.localStorage.getItem(WINDOW_SESSION_STORAGE_KEY)).toContain(
      "w1",
    );
  });

  it("drops windows whose icons no longer exist", () => {
    saveWindowSession({
      windows: [
        sampleWindow,
        {
          ...sampleWindow,
          id: "gone",
          type: "folder",
          iconId: "missing-folder",
        },
      ],
      documentWindowFifo: ["w1", "gone"],
      nextZIndex: 4,
    });

    const loaded = loadWindowSession(DEFAULT_ICONS);
    expect(loaded?.windows.map((item) => item.id)).toEqual(["w1"]);
    expect(loaded?.documentWindowFifo).toEqual(["w1"]);
  });
});
