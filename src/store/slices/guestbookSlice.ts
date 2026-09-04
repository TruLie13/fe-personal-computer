import type { StateCreator } from "zustand";
import {
  canSignGuestbookToday,
  clampGuestbookEntryContent,
  saveLocalGuestbookEntries,
} from "@/lib/guestbook";
import { sessionUsername } from "@/lib/localSession";
import { LOCAL_USER_ID, SEED_GUESTBOOK_ENTRIES } from "@/lib/networkSeed";
import {
  createRemoteGuestbookEntry,
  softDeleteRemoteGuestbookEntry,
} from "@/lib/remoteSocialPersist";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createId } from "@/store/desktopWindowFactory";
import type { GuestbookEntry } from "@/types/network";

export type GuestbookSlice = Pick<
  DesktopStore,
  "localGuestbookEntries" | "signGuestbook" | "deleteGuestbookEntry"
>;

function findEntry(
  local: GuestbookEntry[],
  entryId: string,
): GuestbookEntry | undefined {
  const fromLocal = local.find((entry) => entry.id === entryId);
  if (fromLocal) {
    return fromLocal;
  }
  return SEED_GUESTBOOK_ENTRIES.find((entry) => entry.id === entryId);
}

function guestbookAuthorId(): string {
  return sessionUsername() ?? LOCAL_USER_ID;
}

export const createGuestbookSlice: StateCreator<
  DesktopStore,
  [],
  [],
  GuestbookSlice
> = (set, get) => ({
  localGuestbookEntries: [],

  signGuestbook: (hostUserId, content) => {
    const authorId = guestbookAuthorId();
    const trimmed = clampGuestbookEntryContent(content.trim());
    if (!hostUserId || !trimmed || hostUserId === LOCAL_USER_ID) {
      return "";
    }
    if (hostUserId === authorId) {
      return "";
    }
    if (
      !canSignGuestbookToday(
        get().localGuestbookEntries,
        hostUserId,
        authorId,
      )
    ) {
      return "";
    }
    const localId = createId("gb");
    const entry: GuestbookEntry = {
      id: localId,
      hostUserId,
      authorId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localGuestbookEntries = [entry, ...state.localGuestbookEntries];
      saveLocalGuestbookEntries(localGuestbookEntries);
      return { localGuestbookEntries };
    });

    void createRemoteGuestbookEntry({
      hostUid: hostUserId,
      hostUsername: hostUserId,
      content: trimmed,
    }).then((remote) => {
      if (!remote) {
        return;
      }
      set((state) => {
        const localGuestbookEntries = state.localGuestbookEntries.map((item) =>
          item.id === localId
            ? {
                ...item,
                id: remote.id,
                authorId: remote.authorId,
                createdAt: remote.createdAt,
              }
            : item,
        );
        saveLocalGuestbookEntries(localGuestbookEntries);
        return { localGuestbookEntries };
      });
    });

    return localId;
  },

  deleteGuestbookEntry: (entryId) => {
    const existing = findEntry(get().localGuestbookEntries, entryId);
    if (!existing || existing.deletedAt) {
      return false;
    }

    const authorId = guestbookAuthorId();
    const ownUsername = sessionUsername();
    const onOwnPc = get().viewMode !== "remote";
    const isHostOwner =
      onOwnPc &&
      (existing.hostUserId === LOCAL_USER_ID ||
        (ownUsername != null && existing.hostUserId === ownUsername));
    const isAuthor =
      existing.authorId === LOCAL_USER_ID || existing.authorId === authorId;
    if (!isHostOwner && !isAuthor) {
      return false;
    }

    const deletedAt = new Date().toISOString();
    set((state) => {
      const idx = state.localGuestbookEntries.findIndex(
        (entry) => entry.id === entryId,
      );
      const localGuestbookEntries =
        idx >= 0
          ? state.localGuestbookEntries.map((entry) =>
              entry.id === entryId ? { ...entry, deletedAt } : entry,
            )
          : [{ ...existing, deletedAt }, ...state.localGuestbookEntries];
      saveLocalGuestbookEntries(localGuestbookEntries);
      return { localGuestbookEntries };
    });
    void softDeleteRemoteGuestbookEntry(entryId, isHostOwner);
    return true;
  },
});
