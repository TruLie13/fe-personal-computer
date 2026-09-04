import { getNetworkUser } from "@/lib/networkSeed";
import {
  isOnDesktop,
  isPinnedProfileIcon,
  PROFILE_ICON_POSITION,
} from "@/lib/storage";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type {
  DesktopViewMode,
  NetworkUserId,
  RemoteDesktopSnapshot,
  UserProfile,
} from "@/types/network";

const EMPTY_ICONS: DesktopIcon[] = [];
const EMPTY_DOCUMENTS: TextDocument[] = [];

let lastActiveIconsSource: DesktopIcon[] | null = null;
let lastActiveIconsResult: DesktopIcon[] | null = null;

export function isRemote(state: { viewMode: DesktopViewMode }): boolean {
  return state.viewMode === "remote";
}

function remoteIcons(state: {
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
}): DesktopIcon[] {
  if (!state.remoteUserId) {
    return EMPTY_ICONS;
  }
  const seed = getNetworkUser(state.remoteUserId)?.snapshot.icons;
  if (seed) {
    return seed;
  }
  return state.remoteSnapshot?.icons ?? EMPTY_ICONS;
}

function remoteDocuments(state: {
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
}): TextDocument[] {
  if (!state.remoteUserId) {
    return EMPTY_DOCUMENTS;
  }
  const seed = getNetworkUser(state.remoteUserId)?.snapshot.documents;
  if (seed) {
    return seed;
  }
  return state.remoteSnapshot?.documents ?? EMPTY_DOCUMENTS;
}

export function selectActiveIcons(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
  icons: DesktopIcon[];
}): DesktopIcon[] {
  const source =
    state.viewMode === "remote" && state.remoteUserId
      ? remoteIcons(state)
      : state.icons;

  // Cache by source identity — .map() would return a new array every
  // getSnapshot and trip useSyncExternalStore into an infinite loop.
  if (source === lastActiveIconsSource && lastActiveIconsResult) {
    return lastActiveIconsResult;
  }

  const needsPin = source.some(
    (icon) =>
      isPinnedProfileIcon(icon) &&
      (icon.x !== PROFILE_ICON_POSITION.x ||
        icon.y !== PROFILE_ICON_POSITION.y ||
        icon.parentId != null),
  );

  const result = needsPin
    ? source.map((icon) => {
        if (!isPinnedProfileIcon(icon)) {
          return icon;
        }
        if (
          icon.x === PROFILE_ICON_POSITION.x &&
          icon.y === PROFILE_ICON_POSITION.y &&
          icon.parentId == null
        ) {
          return icon;
        }
        return {
          ...icon,
          x: PROFILE_ICON_POSITION.x,
          y: PROFILE_ICON_POSITION.y,
          ...(icon.parentId != null ? { parentId: null } : {}),
        };
      })
    : source;

  lastActiveIconsSource = source;
  lastActiveIconsResult = result;
  return result;
}

export function selectActiveDocuments(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
  documents: TextDocument[];
}): TextDocument[] {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return remoteDocuments(state);
  }
  return state.documents;
}

export function selectActiveTextFileCount(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
  documents: TextDocument[];
}): number {
  return selectActiveDocuments(state).length;
}

export function selectActiveWallpaper(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
  wallpaper: string;
}): string {
  if (state.viewMode === "remote" && state.remoteUserId) {
    const seed = getNetworkUser(state.remoteUserId)?.snapshot.wallpaper;
    if (seed) {
      return seed;
    }
    return state.remoteSnapshot?.wallpaper ?? state.wallpaper;
  }
  return state.wallpaper;
}

export function selectActiveTitleBarColor(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  remoteSnapshot: RemoteDesktopSnapshot | null;
  titleBarColor: string;
}): string {
  if (state.viewMode === "remote" && state.remoteUserId) {
    const seed = getNetworkUser(state.remoteUserId)?.snapshot.titleBarColor;
    if (seed) {
      return seed;
    }
    return state.remoteSnapshot?.titleBarColor ?? state.titleBarColor;
  }
  return state.titleBarColor;
}

export function selectRemoteProfile(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  remoteProfile: UserProfile | null;
}): UserProfile | null {
  if (state.viewMode !== "remote" || !state.remoteUserId) {
    return null;
  }
  const seed = getNetworkUser(state.remoteUserId);
  if (seed) {
    return {
      displayName: seed.displayName,
      computerName: seed.computerName,
      bio: seed.bio,
      avatarColor: seed.avatarColor,
      avatarUrl: seed.avatarUrl,
    };
  }
  return state.remoteProfile;
}

export function selectDesktopIcons(icons: DesktopIcon[]): DesktopIcon[] {
  return icons.filter(isOnDesktop);
}

export function selectFolderContents(
  icons: DesktopIcon[],
  folderId: string,
): DesktopIcon[] {
  return icons.filter((icon) => icon.parentId === folderId);
}
