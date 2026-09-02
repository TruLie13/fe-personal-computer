import { saveWindowSession } from "@/lib/windowSession";
import { DEFAULT_ICONS, STORAGE_KEY } from "@/lib/storage";
import { readDesktopBootstrap } from "@/store/desktopBootstrap";
import { resetDesktopStore } from "@/test/resetDesktopStore";

describe("readDesktopBootstrap", () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it("restores saved icon and window positions", () => {
    const icons = DEFAULT_ICONS.map((icon) =>
      icon.id === "bulletin-board"
        ? { ...icon, x: 240, y: 64 }
        : icon,
    );
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        icons,
        documents: [],
        wallpaper: "#008080",
        titleBarColor: "#000080",
        contentDark: false,
        taskbarHeight: 36,
      }),
    );
    saveWindowSession({
      windows: [
        {
          id: "window-bulletin-board",
          title: "Bulletin Board",
          type: "bbs",
          iconId: "bulletin-board",
          documentId: null,
          isOpen: true,
          isFocused: true,
          isMinimized: false,
          isMaximized: false,
          x: 180,
          y: 96,
          width: 520,
          height: 440,
          zIndex: 1,
        },
      ],
      documentWindowFifo: [],
      nextZIndex: 2,
    });

    const bootstrap = readDesktopBootstrap();
    expect(bootstrap?.icons.find((icon) => icon.id === "bulletin-board")).toMatchObject({
      x: 240,
      y: 64,
    });
    expect(bootstrap?.windows[0]).toMatchObject({ x: 180, y: 96 });
    expect(bootstrap?.hydrated).toBe(true);
  });
});
