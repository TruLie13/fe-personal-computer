import type { StateCreator } from "zustand";
import {
  canSignGuestbookToday,
  clampGuestbookEntryContent,
  saveLocalGuestbookEntries,
} from "@/lib/guestbook";
import { LOCAL_USER_ID, SEED_GUESTBOOK_ENTRIES } from "@/lib/networkSeed";
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

export const createGuestbookSlice: StateCreator<
  DesktopStore,
  [],
  [],
  GuestbookSlice
> = (set, get) => ({
  localGuestbookEntries: [],

  signGuestbook: (hostUserId, content) => {
    const trimmed = clampGuestbookEntryContent(content.trim());
    if (!hostUserId || !trimmed || hostUserId === LOCAL_USER_ID) {
      return "";
    }
    if (
      !canSignGuestbookToday(
        get().localGuestbookEntries,
        hostUserId,
        LOCAL_USER_ID,
      )
    ) {
      return "";
    }
    const entry: GuestbookEntry = {
      id: createId("gb"),
      hostUserId,
      authorId: LOCAL_USER_ID,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localGuestbookEntries = [entry, ...state.localGuestbookEntries];
      saveLocalGuestbookEntries(localGuestbookEntries);
      return { localGuestbookEntries };
    });
    return entry.id;
  },

  deleteGuestbookEntry: (entryId) => {
    const existing = findEntry(get().localGuestbookEntries, entryId);
    if (!existing || existing.deletedAt) {
      return false;
    }

    const onOwnPc =
      get().viewMode !== "remote" || get().remoteUserId === LOCAL_USER_ID;
    const isHostOwner =
      existing.hostUserId === LOCAL_USER_ID && onOwnPc;
    const isAuthor = existing.authorId === LOCAL_USER_ID;
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
    return true;
  },
});
