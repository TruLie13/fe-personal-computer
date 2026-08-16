import type { StateCreator } from "zustand";
import { saveLocalBbsNotes } from "@/lib/bbsNotes";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createId } from "@/store/desktopWindowFactory";
import type { BbsPost } from "@/types/network";

export type BbsSlice = Pick<
  DesktopStore,
  "localBbsNotes" | "postBbsNote"
>;

export const createBbsSlice: StateCreator<DesktopStore, [], [], BbsSlice> = (
  set,
) => ({
  localBbsNotes: [],

  postBbsNote: (title, content) => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
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
});
