"use client";

import { useEffect, useRef } from "react";
import { isOwnDesktopUsername, sessionUsername } from "@/lib/localSession";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import { filePath, profilePath } from "@/lib/seo/paths";
import {
  selectActiveDocuments,
  useDesktopStore,
} from "@/store/desktopStore";

export interface UseDesktopUrlSyncOptions {
  /**
   * When false, do not touch the address bar.
   * Desktop waits until hydrate + deep-link apply finish so we never
   * clobber `/C/users/maya` back to `/C/users/local` on first paint.
   */
  enabled?: boolean;
  /** Route username from `/C/users/[username]` — guards stale store state. */
  deepLinkUsername?: string;
}

/**
 * Keep the address bar in sync without remounting the App Router page:
 * focused text file → `/C/users/[user]/[slug]`
 * anything else → `/C/users/[user]`
 * Works for both your desktop and a visited remote PC.
 */
function isOwnRouteUsername(username: string | undefined): boolean {
  return (
    !username ||
    username === LOCAL_USER_ID ||
    isOwnDesktopUsername(username)
  );
}

export function useDesktopUrlSync(
  options: UseDesktopUrlSyncOptions = {},
) {
  const enabled = options.enabled ?? true;
  const deepLinkUsername = options.deepLinkUsername;
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const windows = useDesktopStore((state) => state.windows);
  const documents = useDesktopStore(selectActiveDocuments);
  const lastSyncedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Client nav can render the new route before applyDeepLink / goHome runs.
    if (deepLinkUsername) {
      if (
        !isOwnRouteUsername(deepLinkUsername) &&
        viewMode === "local"
      ) {
        return;
      }
      if (isOwnRouteUsername(deepLinkUsername) && viewMode === "remote") {
        return;
      }
    }

    const username =
      viewMode === "remote" && remoteUserId
        ? remoteUserId
        : (sessionUsername() ?? LOCAL_USER_ID);

    const focusedText = windows.find(
      (window) =>
        window.isOpen &&
        !window.isMinimized &&
        window.isFocused &&
        Boolean(window.documentId) &&
        (window.type === "text" || window.type === "editor"),
    );

    let target = profilePath(username);
    if (focusedText?.documentId) {
      const doc = documents.find(
        (document) => document.id === focusedText.documentId,
      );
      if (doc?.slug) {
        target = filePath(username, doc.slug);
      }
    }

    // Never rewrite the marketing home or other routes (e.g. during Sign out).
    if (!window.location.pathname.startsWith("/C/users/")) {
      lastSyncedPath.current = null;
      return;
    }

    if (lastSyncedPath.current === target) {
      return;
    }
    lastSyncedPath.current = target;
    window.history.replaceState(window.history.state, "", target);
  }, [enabled, deepLinkUsername, viewMode, remoteUserId, windows, documents]);
}
