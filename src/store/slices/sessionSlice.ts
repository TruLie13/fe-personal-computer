import type { StateCreator } from "zustand";
import { loadLocalBbsNotes } from "@/lib/bbsNotes";
import { loadFavorites } from "@/lib/favorites";
import {
  computerLabel,
  loadLocalProfile,
} from "@/lib/profile";
import {
  PROFILE_ICON_ID,
  loadDesktopState,
} from "@/lib/storage";
import { loadWindowSession } from "@/lib/windowSession";
import type { DesktopStore } from "@/store/desktopStoreTypes";

export type SessionSlice = Pick<
  DesktopStore,
  | "selectedIconId"
  | "renamingIconId"
  | "isStartMenuOpen"
  | "hydrated"
  | "hydrate"
  | "selectIcon"
  | "toggleStartMenu"
  | "closeStartMenu"
>;

export const createSessionSlice: StateCreator<
  DesktopStore,
  [],
  [],
  SessionSlice
> = (set, get) => ({
  selectedIconId: null,
  renamingIconId: null,
  isStartMenuOpen: false,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    const saved = loadDesktopState();
    const localProfile = loadLocalProfile();
    const icons = saved.icons.map((icon) =>
      icon.id === PROFILE_ICON_ID
        ? { ...icon, label: computerLabel(localProfile.displayName) }
        : icon,
    );
    const session = loadWindowSession(icons);
    const existingWindows = get().windows;
    const restoreSession = existingWindows.length === 0;
    set({
      icons,
      documents: saved.documents,
      wallpaper: saved.wallpaper,
      titleBarColor: saved.titleBarColor,
      contentDark: saved.contentDark,
      taskbarHeight: saved.taskbarHeight,
      favorites: loadFavorites(),
      localBbsNotes: loadLocalBbsNotes(),
      localProfile,
      windows: restoreSession ? (session?.windows ?? []) : existingWindows,
      documentWindowFifo: restoreSession
        ? (session?.documentWindowFifo ?? [])
        : get().documentWindowFifo,
      nextZIndex: restoreSession
        ? (session?.nextZIndex ?? 1)
        : get().nextZIndex,
      hydrated: true,
    });
  },

  selectIcon: (iconId) => {
    set((state) => ({
      selectedIconId: iconId,
      isStartMenuOpen: false,
      renamingIconId:
        iconId != null && state.renamingIconId === iconId
          ? state.renamingIconId
          : null,
    }));
  },

  toggleStartMenu: () => {
    set((state) => ({ isStartMenuOpen: !state.isStartMenuOpen }));
  },

  closeStartMenu: () => {
    set({ isStartMenuOpen: false });
  },
});
