import { loadLocalBbsNotes } from "@/lib/bbsNotes";
import { loadFavorites } from "@/lib/favorites";
import { loadLocalGuestbookEntries } from "@/lib/guestbook";
import { computerLabel, loadLocalProfile } from "@/lib/profile";
import { PROFILE_ICON_ID, loadDesktopState } from "@/lib/storage";
import { loadLocalStoryComments } from "@/lib/storyComments";
import { loadWindowSession } from "@/lib/windowSession";
import type { DesktopStore } from "@/store/desktopStoreTypes";

/** Fields restored from localStorage on first paint (client only). */
export type DesktopBootstrapState = Pick<
  DesktopStore,
  | "icons"
  | "documents"
  | "wallpaper"
  | "titleBarColor"
  | "contentDark"
  | "taskbarHeight"
  | "favorites"
  | "localBbsNotes"
  | "localStoryComments"
  | "localGuestbookEntries"
  | "localProfile"
  | "windows"
  | "documentWindowFifo"
  | "nextZIndex"
  | "hydrated"
>;

/**
 * Read persisted desktop state synchronously so the first client paint matches
 * saved icon/window positions (avoids default → saved flicker on refresh).
 */
export function readDesktopBootstrap(input?: {
  existingWindows?: DesktopStore["windows"];
  documentWindowFifo?: DesktopStore["documentWindowFifo"];
  nextZIndex?: DesktopStore["nextZIndex"];
}): DesktopBootstrapState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existingWindows = input?.existingWindows ?? [];
  const saved = loadDesktopState();
  const localProfile = loadLocalProfile();
  const icons = saved.icons.map((icon) =>
    icon.id === PROFILE_ICON_ID
      ? { ...icon, label: computerLabel(localProfile.displayName) }
      : icon,
  );
  const session = loadWindowSession(icons);
  const restoreSession = existingWindows.length === 0;

  return {
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
      : (input?.documentWindowFifo ?? []),
    nextZIndex: restoreSession
      ? (session?.nextZIndex ?? 1)
      : (input?.nextZIndex ?? 1),
    hydrated: true,
  };
}
