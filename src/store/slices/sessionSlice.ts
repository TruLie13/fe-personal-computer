import type { StateCreator } from "zustand";
import { loadLocalBbsNotes } from "@/lib/bbsNotes";
import { loadFavorites } from "@/lib/favorites";
import { loadLocalGuestbookEntries } from "@/lib/guestbook";
import {
  computerLabel,
  loadLocalProfile,
} from "@/lib/profile";
import {
  PROFILE_ICON_ID,
  loadDesktopState,
} from "@/lib/storage";
import { loadLocalStoryComments } from "@/lib/storyComments";
import { loadWindowSession } from "@/lib/windowSession";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import {
  selectionFromIcon,
  selectionFromIds,
} from "@/store/selectionState";

export type SessionSlice = Pick<
  DesktopStore,
  | "selectedIconId"
  | "selectedIconIds"
  | "renamingIconId"
  | "isStartMenuOpen"
  | "hydrated"
  | "hydrate"
  | "selectIcon"
  | "setSelectedIcons"
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
  selectedIconIds: [],
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
      localStoryComments: loadLocalStoryComments(),
      localGuestbookEntries: loadLocalGuestbookEntries(),
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
      ...selectionFromIcon(iconId),
      isStartMenuOpen: false,
      renamingIconId:
        iconId != null && state.renamingIconId === iconId
          ? state.renamingIconId
          : null,
    }));
  },

  setSelectedIcons: (iconIds) => {
    set({
      ...selectionFromIds(iconIds),
      isStartMenuOpen: false,
      renamingIconId: null,
    });
  },

  toggleStartMenu: () => {
    set((state) => ({ isStartMenuOpen: !state.isStartMenuOpen }));
  },

  closeStartMenu: () => {
    set({ isStartMenuOpen: false });
  },
});
