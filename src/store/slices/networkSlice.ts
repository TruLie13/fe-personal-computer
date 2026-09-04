import type { StateCreator } from "zustand";
import { isFavorite } from "@/lib/favorites";
import { isOwnDesktopUsername } from "@/lib/localSession";
import { getNetworkUser, LOCAL_USER_ID } from "@/lib/networkSeed";
import {
  scheduleAddFavorite,
  scheduleRemoveFavorite,
} from "@/lib/remoteSocialPersist";
import { loadWindowSession } from "@/lib/windowSession";
import { persistFavorites } from "@/store/desktopPersist";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createWindowFromIcon } from "@/store/desktopWindowFactory";
import {
  selectActiveDocuments,
  selectActiveIcons,
} from "@/store/desktopSelectors";
import { selectionFromIcon } from "@/store/selectionState";
import type {
  DesktopWindow,
} from "@/types/desktop";
import type {
  RemoteDesktopSnapshot,
  UserProfile,
} from "@/types/network";

export type NetworkSlice = Pick<
  DesktopStore,
  | "viewMode"
  | "remoteUserId"
  | "remoteSnapshot"
  | "remoteProfile"
  | "favorites"
  | "visitRemotePc"
  | "visitRemoteDesktop"
  | "goHome"
  | "applyDeepLink"
  | "addFavorite"
  | "removeFavorite"
>;

function enterRemoteDesktop(
  set: Parameters<StateCreator<DesktopStore, [], [], NetworkSlice>>[0],
  userId: string,
  windows: DesktopWindow[],
  selectedIconId: string | null,
  nextZIndex: number,
  remote?: {
    snapshot: RemoteDesktopSnapshot;
    profile: UserProfile;
  } | null,
) {
  set({
    viewMode: "remote",
    remoteUserId: userId,
    remoteSnapshot: remote?.snapshot ?? null,
    remoteProfile: remote?.profile ?? null,
    windows,
    documentWindowFifo: [],
    ...selectionFromIcon(selectedIconId),
    renamingIconId: null,
    isStartMenuOpen: false,
    nextZIndex,
  });
}

export const createNetworkSlice: StateCreator<
  DesktopStore,
  [],
  [],
  NetworkSlice
> = (set, get) => ({
  viewMode: "local",
  remoteUserId: null,
  remoteSnapshot: null,
  remoteProfile: null,
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
    enterRemoteDesktop(
      set,
      userId,
      windows,
      profileIcon?.id ?? null,
      nextZIndex,
      null,
    );
  },

  visitRemoteDesktop: (input) => {
    const profileIcon = input.snapshot.icons.find(
      (icon) => icon.type === "profile",
    );
    const windows: DesktopWindow[] = [];
    let nextZIndex = 1;
    if (profileIcon) {
      windows.push(
        createWindowFromIcon(profileIcon, 1, 0, input.snapshot.icons),
      );
      nextZIndex = 2;
    }
    enterRemoteDesktop(
      set,
      input.userId,
      windows,
      profileIcon?.id ?? null,
      nextZIndex,
      { snapshot: input.snapshot, profile: input.profile },
    );
  },

  goHome: () => {
    const session = loadWindowSession(get().icons);
    set({
      viewMode: "local",
      remoteUserId: null,
      remoteSnapshot: null,
      remoteProfile: null,
      windows: session?.windows ?? [],
      documentWindowFifo: session?.documentWindowFifo ?? [],
      ...selectionFromIcon(null),
      renamingIconId: null,
      isStartMenuOpen: false,
      nextZIndex: session?.nextZIndex ?? 1,
    });
  },

  applyDeepLink: ({ username, fileSlug }) => {
    const { visitRemotePc, goHome, openWindow, focusWindow } = get();
    const stateBefore = get();
    const alreadyOnRemote =
      username !== LOCAL_USER_ID &&
      !isOwnDesktopUsername(username) &&
      stateBefore.viewMode === "remote" &&
      stateBefore.remoteUserId === username;
    const alreadyLocal =
      (username === LOCAL_USER_ID || isOwnDesktopUsername(username)) &&
      stateBefore.viewMode === "local";

    if (!fileSlug) {
      if (username === LOCAL_USER_ID || isOwnDesktopUsername(username)) {
        if (!alreadyLocal) {
          goHome();
        }
        // Own desktop home: do not force-open the profile window.
        return;
      }
      if (!alreadyOnRemote) {
        visitRemotePc(username);
      } else {
        get().openProfile();
      }
      return;
    }

    if (username === LOCAL_USER_ID || isOwnDesktopUsername(username)) {
      if (!alreadyLocal) {
        goHome();
      }
    } else if (!alreadyOnRemote) {
      const user = getNetworkUser(username);
      if (!user) {
        return;
      }
      enterRemoteDesktop(set, username, [], null, 1);
    }

    const state = get();
    const documents = selectActiveDocuments(state);
    const icons = selectActiveIcons(state);
    const document = documents.find((doc) => doc.slug === fileSlug);
    if (!document) {
      return;
    }

    const fileIcon = icons.find(
      (icon) => icon.type === "text" && icon.documentId === document.id,
    );
    if (!fileIcon) {
      return;
    }

    const parentId = fileIcon.parentId ?? null;
    if (parentId) {
      openWindow(parentId);
    }
    openWindow(fileIcon.id);

    const fileWindow = get().windows.find(
      (window) =>
        window.isOpen &&
        (window.iconId === fileIcon.id ||
          window.documentId === document.id),
    );
    if (fileWindow) {
      focusWindow(fileWindow.id);
    }
  },

  addFavorite: (userId) => {
    if (
      !userId ||
      userId === LOCAL_USER_ID ||
      isOwnDesktopUsername(userId)
    ) {
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
      scheduleAddFavorite(userId, userId);
      return { favorites };
    });
  },

  removeFavorite: (userId) => {
    set((state) => {
      const favorites = state.favorites.filter(
        (favorite) => favorite.userId !== userId,
      );
      persistFavorites(favorites);
      scheduleRemoveFavorite(userId);
      return { favorites };
    });
  },
});
