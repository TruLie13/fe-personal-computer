import type { StateCreator } from "zustand";
import {
  canPostBbsNoteToday,
  clampBbsNoteContent,
  clampBbsNoteTitle,
  saveLocalBbsNotes,
} from "@/lib/bbsNotes";
import { sessionUsername } from "@/lib/localSession";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import {
  createRemoteBbsNote,
  softDeleteRemoteBbsNote,
} from "@/lib/remoteSocialPersist";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createId } from "@/store/desktopWindowFactory";
import type { BbsPost } from "@/types/network";

export type BbsSlice = Pick<
  DesktopStore,
  "localBbsNotes" | "postBbsNote" | "deleteBbsNote"
>;

function bbsAuthorId(): string {
  return sessionUsername() ?? LOCAL_USER_ID;
}

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
    const authorId = bbsAuthorId();
    const localId = createId("bbs");
    const note: BbsPost = {
      id: localId,
      authorId,
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localBbsNotes = [note, ...state.localBbsNotes];
      saveLocalBbsNotes(localBbsNotes);
      return { localBbsNotes };
    });

    void createRemoteBbsNote({
      title: trimmedTitle,
      body: trimmedContent,
    }).then((remote) => {
      if (!remote) {
        return;
      }
      set((state) => {
        const localBbsNotes = state.localBbsNotes.map((item) =>
          item.id === localId
            ? {
                ...item,
                id: remote.id,
                authorId: remote.authorId,
                createdAt: remote.createdAt,
              }
            : item,
        );
        saveLocalBbsNotes(localBbsNotes);
        return { localBbsNotes };
      });
    });

    return localId;
  },

  deleteBbsNote: (postId) => {
    const authorId = bbsAuthorId();
    const existing = get().localBbsNotes.find((post) => post.id === postId);
    if (
      !existing ||
      (existing.authorId !== authorId &&
        existing.authorId !== LOCAL_USER_ID) ||
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
    void softDeleteRemoteBbsNote(postId);
    return true;
  },
});
