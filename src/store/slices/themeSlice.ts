import type { StateCreator } from "zustand";
import { scheduleRemoteThemeSave } from "@/lib/remoteDesktopPersist";
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

function queueThemeFromState(state: {
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
}) {
  scheduleRemoteThemeSave({
    wallpaper: state.wallpaper,
    titleBarColor: state.titleBarColor,
    contentDark: state.contentDark,
  });
}

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
      const patch = commitDesktopPatch(state, { wallpaper });
      queueThemeFromState({
        wallpaper,
        titleBarColor: state.titleBarColor,
        contentDark: state.contentDark,
      });
      return patch;
    });
  },

  setTitleBarColor: (color) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const titleBarColor = color.toLowerCase();
      const patch = commitDesktopPatch(state, { titleBarColor });
      queueThemeFromState({
        wallpaper: state.wallpaper,
        titleBarColor,
        contentDark: state.contentDark,
      });
      return patch;
    });
  },

  setContentDark: (enabled) => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const patch = commitDesktopPatch(state, { contentDark: enabled });
      queueThemeFromState({
        wallpaper: state.wallpaper,
        titleBarColor: state.titleBarColor,
        contentDark: enabled,
      });
      return patch;
    });
  },

  setTaskbarHeight: (height) => {
    const taskbarHeight = clampTaskbarHeight(height);
    set((state) => {
      if (state.taskbarHeight === taskbarHeight) {
        return state;
      }
      // Taskbar height stays local-only (not on users/{uid} yet).
      return commitDesktopPatch(state, { taskbarHeight });
    });
  },

  resetTheme: () => {
    if (!assertLocalWritable(get)) {
      return;
    }
    set((state) => {
      const patch = commitDesktopPatch(state, {
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
        contentDark: DEFAULT_CONTENT_DARK,
        taskbarHeight: DEFAULT_TASKBAR_HEIGHT,
      });
      queueThemeFromState({
        wallpaper: DEFAULT_WALLPAPER,
        titleBarColor: DEFAULT_TITLE_BAR_COLOR,
        contentDark: DEFAULT_CONTENT_DARK,
      });
      return patch;
    });
  },
});
