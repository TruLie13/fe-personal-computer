"use client";

import { useEffect, useRef } from "react";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import { filePath, profilePath } from "@/lib/seo/paths";
import {
  selectActiveDocuments,
  useDesktopStore,
} from "@/store/desktopStore";

/**
 * Keep the address bar in sync without remounting the App Router page:
 * focused text file → `/C/users/[user]/[slug]`
 * anything else → `/C/users/[user]`
 * Works for both your desktop and a visited remote PC.
 */
export function useDesktopUrlSync() {
  const viewMode = useDesktopStore((state) => state.viewMode);
  const remoteUserId = useDesktopStore((state) => state.remoteUserId);
  const windows = useDesktopStore((state) => state.windows);
  const documents = useDesktopStore(selectActiveDocuments);
  const lastSyncedPath = useRef<string | null>(null);

  useEffect(() => {
    const username =
      viewMode === "remote" && remoteUserId
        ? remoteUserId
        : LOCAL_USER_ID;

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

    if (lastSyncedPath.current === target) {
      return;
    }
    lastSyncedPath.current = target;
    window.history.replaceState(window.history.state, "", target);
  }, [viewMode, remoteUserId, windows, documents]);
}
