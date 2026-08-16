import type { StateCreator } from "zustand";
import { isFavorite } from "@/lib/favorites";
import { getNetworkUser } from "@/lib/networkSeed";
import { persistFavorites } from "@/store/desktopPersist";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createWindowFromIcon } from "@/store/desktopWindowFactory";
import type { DesktopWindow } from "@/types/desktop";

export type NetworkSlice = Pick<
  DesktopStore,
  | "viewMode"
  | "remoteUserId"
  | "favorites"
  | "visitRemotePc"
  | "goHome"
  | "addFavorite"
  | "removeFavorite"
>;

export const createNetworkSlice: StateCreator<
  DesktopStore,
  [],
  [],
  NetworkSlice
> = (set) => ({
  viewMode: "local",
  remoteUserId: null,
  favorites: [],

  visitRemotePc: (userId) => {
    const user = getNetworkUser(userId);
    if (!user) {
      return;
    }
    const profileIcon = user.snapshot.icons.find(
      (icon) => icon.type === "profile",
    );
    const windows: DesktopWindow[] = [];
    let nextZIndex = 1;
    if (profileIcon) {
      windows.push(
        createWindowFromIcon(profileIcon, 1, 0, user.snapshot.icons),
      );
      nextZIndex = 2;
    }
    set({
      viewMode: "remote",
      remoteUserId: userId,
      windows,
      selectedIconId: profileIcon?.id ?? null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex,
    });
  },

  goHome: () => {
    set({
      viewMode: "local",
      remoteUserId: null,
      windows: [],
      selectedIconId: null,
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: 1,
    });
  },

  addFavorite: (userId) => {
    if (!getNetworkUser(userId)) {
      return;
    }
    set((state) => {
      if (isFavorite(state.favorites, userId)) {
        return state;
      }
      const favorites = [
        ...state.favorites,
        { userId, addedAt: new Date().toISOString() },
      ];
      persistFavorites(favorites);
      return { favorites };
    });
  },

  removeFavorite: (userId) => {
    set((state) => {
      const favorites = state.favorites.filter(
        (favorite) => favorite.userId !== userId,
      );
      persistFavorites(favorites);
      return { favorites };
    });
  },
});
