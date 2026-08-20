import {
  DEFAULT_DOCUMENTS,
  DEFAULT_ICONS,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";

/** Shared store reset for desktop component tests. */
export function resetDesktopStore() {
  useDesktopStore.setState({
    icons: DEFAULT_ICONS,
    documents: DEFAULT_DOCUMENTS,
    windows: [],
    documentWindowFifo: [],
    wallpaper: DEFAULT_WALLPAPER,
    titleBarColor: DEFAULT_TITLE_BAR_COLOR,
    contentDark: false,
    taskbarHeight: 36,
    selectedIconId: null,
    renamingIconId: null,
    isStartMenuOpen: false,
    nextZIndex: 1,
    hydrated: false,
    viewMode: "local",
    remoteUserId: null,
    favorites: [],
    localBbsNotes: [],
    localProfile: {
      displayName: "Writer",
      computerName: "WRITER-PC",
      bio: "test",
      avatarColor: "#000080",
      avatarUrl: null,
    },
  });
  window.localStorage.clear();
}
