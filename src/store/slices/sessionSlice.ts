import type { StateCreator } from "zustand";
import { readDesktopBootstrap } from "@/store/desktopBootstrap";
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
    const state = get();
    const bootstrap = readDesktopBootstrap({
      existingWindows: state.windows,
      documentWindowFifo: state.documentWindowFifo,
      nextZIndex: state.nextZIndex,
    });
    if (bootstrap) {
      set(bootstrap);
    } else {
      set({ hydrated: true });
    }
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
