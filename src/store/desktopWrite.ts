import { persistDesktop, type DesktopPersistFields } from "@/store/desktopPersist";
import { isRemote } from "@/store/desktopSelectors";
import type { DesktopViewMode } from "@/types/network";

/** Returns false when the desktop is in a read-only remote visit. */
export function assertLocalWritable(get: () => {
  viewMode: DesktopViewMode;
}): boolean {
  return !isRemote(get());
}

/**
 * Persist desktop fields implied by `patch`, then return `patch` for `set(...)`.
 * Use inside `set((state) => commitDesktopPatch(state, { ... }))` or before `set(patch)`.
 * Extra non-persisted keys (windows, selection, etc.) are passed through unchanged.
 */
export function commitDesktopPatch<T extends object>(
  state: DesktopPersistFields,
  patch: T,
): T {
  const persisted = patch as T & Partial<DesktopPersistFields>;
  persistDesktop({
    icons: persisted.icons ?? state.icons,
    documents: persisted.documents ?? state.documents,
    wallpaper: persisted.wallpaper ?? state.wallpaper,
    titleBarColor: persisted.titleBarColor ?? state.titleBarColor,
    contentDark: persisted.contentDark ?? state.contentDark,
    taskbarHeight: persisted.taskbarHeight ?? state.taskbarHeight,
  });
  return patch;
}
