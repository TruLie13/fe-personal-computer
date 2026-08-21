import type { StateCreator } from "zustand";
import { centeredWindowPosition } from "@/lib/desktopBounds";
import {
  canPostStoryCommentToday,
  clampStoryCommentContent,
  saveLocalStoryComments,
} from "@/lib/storyComments";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createId, WINDOW_DEFAULTS } from "@/store/desktopWindowFactory";
import type { StoryComment } from "@/types/network";

export type CommentsSlice = Pick<
  DesktopStore,
  | "localStoryComments"
  | "postStoryComment"
  | "deleteStoryComment"
  | "openStoryComments"
>;

export const createCommentsSlice: StateCreator<
  DesktopStore,
  [],
  [],
  CommentsSlice
> = (set, get) => ({
  localStoryComments: [],

  postStoryComment: (documentId, content) => {
    const trimmed = clampStoryCommentContent(content.trim());
    if (!documentId || !trimmed) {
      return "";
    }
    if (!canPostStoryCommentToday(get().localStoryComments)) {
      return "";
    }
    const comment: StoryComment = {
      id: createId("cmt"),
      documentId,
      authorId: LOCAL_USER_ID,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localStoryComments = [comment, ...state.localStoryComments];
      saveLocalStoryComments(localStoryComments);
      return { localStoryComments };
    });
    return comment.id;
  },

  deleteStoryComment: (commentId) => {
    const existing = get().localStoryComments.find(
      (comment) => comment.id === commentId,
    );
    if (!existing || existing.authorId !== LOCAL_USER_ID) {
      return false;
    }
    set((state) => {
      const localStoryComments = state.localStoryComments.filter(
        (comment) => comment.id !== commentId,
      );
      saveLocalStoryComments(localStoryComments);
      return { localStoryComments };
    });
    return true;
  },

  openStoryComments: ({ documentId, storyTitle }) => {
    if (!documentId) {
      return;
    }
    const state = get();
    const existing = state.windows.find(
      (window) =>
        window.type === "comments" &&
        window.documentId === documentId &&
        window.isOpen,
    );
    if (existing) {
      const zIndex = state.nextZIndex;
      set({
        windows: state.windows.map((window) => {
          if (window.id === existing.id) {
            return {
              ...window,
              title: `Comments — ${storyTitle}`,
              isFocused: true,
              isMinimized: false,
              zIndex,
            };
          }
          return { ...window, isFocused: false };
        }),
        nextZIndex: zIndex + 1,
        isStartMenuOpen: false,
      });
      return;
    }

    const defaults = WINDOW_DEFAULTS.comments;
    const zIndex = state.nextZIndex;
    const openCount = state.windows.filter((window) => window.isOpen).length;
    const position =
      openCount === 0
        ? centeredWindowPosition({
            width: defaults.width,
            height: defaults.height,
          })
        : {
            x: 100 + openCount * 24,
            y: 64 + openCount * 24,
          };

    const nextWindow = {
      id: createId("window-comments"),
      title: `Comments — ${storyTitle}`,
      type: "comments" as const,
      iconId: "comments",
      documentId,
      isOpen: true,
      isFocused: true,
      isMinimized: false,
      ...position,
      width: defaults.width,
      height: defaults.height,
      zIndex,
    };

    set({
      windows: [
        ...state.windows.map((window) => ({ ...window, isFocused: false })),
        nextWindow,
      ],
      nextZIndex: zIndex + 1,
      isStartMenuOpen: false,
    });
  },
});
