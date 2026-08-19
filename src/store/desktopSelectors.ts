import { getNetworkUser } from "@/lib/networkSeed";
import {
  isOnDesktop,
  isPinnedProfileIcon,
  PROFILE_ICON_POSITION,
} from "@/lib/storage";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type { DesktopViewMode, NetworkUserId } from "@/types/network";

const EMPTY_ICONS: DesktopIcon[] = [];
const EMPTY_DOCUMENTS: TextDocument[] = [];

let lastActiveIconsSource: DesktopIcon[] | null = null;
let lastActiveIconsResult: DesktopIcon[] | null = null;

export function isRemote(state: { viewMode: DesktopViewMode }): boolean {
  return state.viewMode === "remote";
}

export function selectActiveIcons(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  icons: DesktopIcon[];
}): DesktopIcon[] {
  const source =
    state.viewMode === "remote" && state.remoteUserId
      ? (getNetworkUser(state.remoteUserId)?.snapshot.icons ?? EMPTY_ICONS)
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
  documents: TextDocument[];
}): TextDocument[] {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return (
      getNetworkUser(state.remoteUserId)?.snapshot.documents ?? EMPTY_DOCUMENTS
    );
  }
  return state.documents;
}

export function selectActiveTextFileCount(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  documents: TextDocument[];
}): number {
  return selectActiveDocuments(state).length;
}

export function selectActiveWallpaper(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  wallpaper: string;
}): string {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return (
      getNetworkUser(state.remoteUserId)?.snapshot.wallpaper ?? state.wallpaper
    );
  }
  return state.wallpaper;
}

export function selectActiveTitleBarColor(state: {
  viewMode: DesktopViewMode;
  remoteUserId: NetworkUserId | null;
  titleBarColor: string;
}): string {
  if (state.viewMode === "remote" && state.remoteUserId) {
    return (
      getNetworkUser(state.remoteUserId)?.snapshot.titleBarColor ??
      state.titleBarColor
    );
  }
  return state.titleBarColor;
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
