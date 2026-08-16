import type { StateCreator } from "zustand";
import {
  DEFAULT_CONTENT_DARK,
  DEFAULT_TASKBAR_HEIGHT,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
  clampTaskbarHeight,
} from "@/lib/storage";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import {
  assertLocalWritable,
  commitDesktopPatch,
} from "@/store/desktopWrite";

export type ThemeSlice = Pick<
  DesktopStore,
  | "wallpaper"
  | "titleBarColor"
  | "contentDark"
  | "taskbarHeight"
  | "setWallpaper"
  | "setTitleBarColor"
  | "setContentDark"
  | "setTaskbarHeight"
  | "resetTheme"
>;

export const createThemeSlice: StateCreator<
  DesktopStore,
  [],
  [],
  ThemeSlice
> = (set, get) => ({
  wallpaper: DEFAULT_WALLPAPER,
  titleBarColor: DEFAULT_TITLE_BAR_COLOR,
  contentDark: DEFAULT_CONTENT_DARK,
  taskbarHeight: DEFAULT_TASKBAR_HEIGHT,

  setWallpaper: (color) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const wallpaper = color.toLowerCase();
      return commitDesktopPatch(state, { wallpaper });
    });
  },

  setTitleBarColor: (color) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const titleBarColor = color.toLowerCase();
      return commitDesktopPatch(state, { titleBarColor });
    });
  },

  setContentDark: (enabled) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => commitDesktopPatch(state, { contentDark: enabled }));
  },

  setTaskbarHeight: (height) => {
    const taskbarHeight = clampTaskbarHeight(height);
    set((state) => {
      if (state.taskbarHeight === taskbarHeight) {
        return state;
      }
      return commitDesktopPatch(state, { taskbarHeight });
    });
  },

  resetTheme: () => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) =>
      commitDesktopPatch(state, {
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
        contentDark: DEFAULT_CONTENT_DARK,
        taskbarHeight: DEFAULT_TASKBAR_HEIGHT,
      }),
    );
  },
});
