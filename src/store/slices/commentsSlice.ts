import type { StateCreator } from "zustand";
import {
  canPostStoryCommentToday,
  clampStoryCommentContent,
  saveLocalStoryComments,
} from "@/lib/storyComments";
import { sessionUsername } from "@/lib/localSession";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import {
  createRemoteStoryComment,
  softDeleteRemoteStoryComment,
} from "@/lib/remoteSocialPersist";
import { getCurrentAuthUser } from "@/lib/firebase/auth";
import type { DesktopStore } from "@/store/desktopStoreTypes";
import { createId, createTypedWindow } from "@/store/desktopWindowFactory";
import type { StoryComment } from "@/types/network";

export type CommentsSlice = Pick<
  DesktopStore,
  | "localStoryComments"
  | "postStoryComment"
  | "deleteStoryComment"
  | "openStoryComments"
>;

function commentAuthorId(): string {
  return sessionUsername() ?? LOCAL_USER_ID;
}

function guessOwnerUid(documentId: string): string {
  if (documentId.startsWith("maya-")) {
    return "maya";
  }
  if (documentId.startsWith("rex-")) {
    return "rex";
  }
  try {
    return getCurrentAuthUser()?.uid ?? LOCAL_USER_ID;
  } catch {
    return LOCAL_USER_ID;
  }
}

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
    const authorId = commentAuthorId();
    const localId = createId("cmt");
    const comment: StoryComment = {
      id: localId,
      documentId,
      authorId,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const localStoryComments = [comment, ...state.localStoryComments];
      saveLocalStoryComments(localStoryComments);
      return { localStoryComments };
    });

    void createRemoteStoryComment({
      documentId,
      ownerUid: guessOwnerUid(documentId),
      content: trimmed,
    }).then((remote) => {
      if (!remote) {
        return;
      }
      set((state) => {
        const localStoryComments = state.localStoryComments.map((item) =>
          item.id === localId
            ? {
                ...item,
                id: remote.id,
                authorId: remote.authorId,
                createdAt: remote.createdAt,
              }
            : item,
        );
        saveLocalStoryComments(localStoryComments);
        return { localStoryComments };
      });
    });

    return localId;
  },

  deleteStoryComment: (commentId) => {
    const authorId = commentAuthorId();
    const existing = get().localStoryComments.find(
      (comment) => comment.id === commentId,
    );
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
      const localStoryComments = state.localStoryComments.map((comment) =>
        comment.id === commentId ? { ...comment, deletedAt } : comment,
      );
      saveLocalStoryComments(localStoryComments);
      return { localStoryComments };
    });
    void softDeleteRemoteStoryComment(commentId);
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

    const zIndex = state.nextZIndex;
    const openCount = state.windows.filter((window) => window.isOpen).length;
    const nextWindow = createTypedWindow({
      type: "comments",
      title: `Comments — ${storyTitle}`,
      iconId: "comments",
      documentId,
      zIndex,
      openCount,
      idPrefix: "window-comments",
    });

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
