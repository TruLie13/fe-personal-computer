"use client";

import { useEffect, useRef } from "react";
import { subscribeAuthState } from "@/lib/firebase/auth";
import { loadLocalSession } from "@/lib/localSession";
import {
  flushPendingRemotePersists,
  scheduleRemoteDesktopLayoutSave,
  scheduleRemoteProfileSave,
} from "@/lib/remoteDesktopPersist";
import { getDesktopRepository } from "@/lib/repository";
import { applySignedInSession } from "@/lib/setupAccount";

/**
 * After Auth restores (refresh), pull profile, theme, and files from Firestore
 * over the localStorage bootstrap.
 */
export function useSignedInProfileThemeHydrate() {
  const hydratedUid = useRef<string | null>(null);

  useEffect(() => {
    try {
      return subscribeAuthState((user) => {
        if (!user) {
          hydratedUid.current = null;
          return;
        }
        if (!loadLocalSession()) {
          return;
        }
        if (hydratedUid.current === user.uid) {
          return;
        }
        hydratedUid.current = user.uid;
        void (async () => {
          try {
            const { useDesktopStore } = await import("@/store/desktopStore");
            const before = useDesktopStore.getState();
            const profileBefore = before.localProfile;
            const docsBefore = before.documents;
            const iconsBefore = before.icons;

            const desktop = await getDesktopRepository().loadDesktop(user.uid);
            if (!desktop) {
              flushPendingRemotePersists();
              return;
            }

            const after = useDesktopStore.getState();
            const profileEditedDuringLoad =
              after.localProfile.bio !== profileBefore.bio ||
              after.localProfile.displayName !== profileBefore.displayName ||
              after.localProfile.computerName !== profileBefore.computerName ||
              after.localProfile.avatarColor !== profileBefore.avatarColor ||
              after.localProfile.avatarUrl !== profileBefore.avatarUrl;
            const fsEditedDuringLoad =
              after.documents !== docsBefore || after.icons !== iconsBefore;

            applySignedInSession({
              username: desktop.username,
              email: user.email ?? loadLocalSession()?.email ?? "",
              profile: profileEditedDuringLoad
                ? after.localProfile
                : desktop.profile,
              theme: desktop.theme,
              fs: fsEditedDuringLoad
                ? { icons: after.icons, documents: after.documents }
                : {
                    icons: desktop.icons,
                    documents: desktop.documents,
                  },
            });

            // Queued edits (Auth was null) or edits during load — push to Firestore.
            flushPendingRemotePersists();
            if (profileEditedDuringLoad) {
              scheduleRemoteProfileSave(
                useDesktopStore.getState().localProfile,
              );
            }
            if (fsEditedDuringLoad) {
              const state = useDesktopStore.getState();
              scheduleRemoteDesktopLayoutSave(state.icons, state.documents);
            }

            try {
              const { pullRemoteBbsNotes, pullRemoteFavorites } =
                await import("@/lib/remoteSocialPersist");
              const { persistFavorites } = await import("@/store/desktopPersist");
              const { saveLocalBbsNotes } = await import("@/lib/bbsNotes");
              const [favorites, bbsNotes] = await Promise.all([
                pullRemoteFavorites(),
                pullRemoteBbsNotes(),
              ]);
              if (favorites.length > 0) {
                persistFavorites(favorites);
                useDesktopStore.setState({ favorites });
              }
              if (bbsNotes.length > 0) {
                saveLocalBbsNotes(bbsNotes);
                useDesktopStore.setState({ localBbsNotes: bbsNotes });
              }
            } catch {
              // Social feeds optional if emulator/index missing.
            }
          } catch {
            // Emulator down or rules — keep localStorage bootstrap.
            flushPendingRemotePersists();
          }
        })();
      });
    } catch {
      return undefined;
    }
  }, []);
}
