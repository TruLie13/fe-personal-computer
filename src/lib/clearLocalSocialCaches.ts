"use client";

import { BBS_NOTES_STORAGE_KEY } from "@/lib/bbsNotes";
import { FAVORITES_STORAGE_KEY, saveFavorites } from "@/lib/favorites";
import { GUESTBOOK_STORAGE_KEY } from "@/lib/guestbook";
import { STORY_COMMENTS_STORAGE_KEY } from "@/lib/storyComments";

/**
 * Drop browser-local social caches so a new account does not inherit the
 * previous visitor's favorites / notes / comments.
 */
export function clearLocalSocialCaches(): void {
  if (typeof window === "undefined") {
    return;
  }
  saveFavorites([]);
  window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
  window.localStorage.removeItem(BBS_NOTES_STORAGE_KEY);
  window.localStorage.removeItem(STORY_COMMENTS_STORAGE_KEY);
  window.localStorage.removeItem(GUESTBOOK_STORAGE_KEY);
}

/** Reset Zustand social slices after logout / before a new session. */
export function resetSocialStoreState(): void {
  void import("@/store/desktopStore").then(({ useDesktopStore }) => {
    useDesktopStore.setState({
      favorites: [],
      localBbsNotes: [],
      localStoryComments: [],
      localGuestbookEntries: [],
    });
  });
}
