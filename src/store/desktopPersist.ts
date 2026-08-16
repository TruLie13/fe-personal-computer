import { saveFavorites } from "@/lib/favorites";
import { saveDesktopState } from "@/lib/storage";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type { FavoritePc } from "@/types/network";

export interface DesktopPersistFields {
  icons: DesktopIcon[];
  documents: TextDocument[];
  wallpaper: string;
  titleBarColor: string;
  contentDark: boolean;
  taskbarHeight: number;
}

/** Persist the local desktop snapshot (icons, docs, theme chrome). */
export function persistDesktop(state: DesktopPersistFields): void {
  saveDesktopState({
    icons: state.icons,
    documents: state.documents,
    wallpaper: state.wallpaper,
    titleBarColor: state.titleBarColor,
    contentDark: state.contentDark,
    taskbarHeight: state.taskbarHeight,
  });
}

export function persistFavorites(favorites: FavoritePc[]): void {
  saveFavorites(favorites);
}
