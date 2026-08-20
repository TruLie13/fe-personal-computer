import type { StateCreator } from "zustand";
import {
  canPostBbsNoteToday,
  clampBbsNoteContent,
  clampBbsNoteTitle,
  saveLocalBbsNotes,
} from "@/lib/bbsNotes";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createId } from "@/store/desktopWindowFactory";
import type { BbsPost } from "@/types/network";

export type BbsSlice = Pick<
  DesktopStore,
  "localBbsNotes" | "postBbsNote" | "deleteBbsNote"
>;

export const createBbsSlice: StateCreator<DesktopStore, [], [], BbsSlice> = (
  set,
  get,
) => ({
  localBbsNotes: [],

  postBbsNote: (title, content) => {
    const trimmedTitle = clampBbsNoteTitle(title.trim());
    const trimmedContent = clampBbsNoteContent(content.trim());
    if (!trimmedTitle || !trimmedContent) {
      return "";
    }
    if (!canPostBbsNoteToday(get().localBbsNotes)) {
      return "";
    }
    const note: BbsPost = {
      id: createId("bbs"),
      authorId: LOCAL_USER_ID,
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localBbsNotes = [note, ...state.localBbsNotes];
      saveLocalBbsNotes(localBbsNotes);
      return { localBbsNotes };
    });
    return note.id;
  },

  deleteBbsNote: (postId) => {
    const existing = get().localBbsNotes.find((post) => post.id === postId);
    if (
      !existing ||
      existing.authorId !== LOCAL_USER_ID ||
      existing.deletedAt
    ) {
      return false;
    }
    const deletedAt = new Date().toISOString();
    set((state) => {
      const localBbsNotes = state.localBbsNotes.map((post) =>
        post.id === postId ? { ...post, deletedAt } : post,
      );
      saveLocalBbsNotes(localBbsNotes);
      return { localBbsNotes };
    });
    return true;
  },
});
