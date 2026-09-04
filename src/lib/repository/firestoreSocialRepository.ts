"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase/client";
import type { SocialRepository } from "@/lib/repository/SocialRepository";
import type {
  BbsPost,
  FavoritePc,
  GuestbookEntry,
  PublicStory,
  StoryComment,
} from "@/types/network";

function timestampToIso(value: unknown): string {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

export function createFirestoreSocialRepository(): SocialRepository {
  return {
    async loadFavorites(uid) {
      const snap = await getDocs(
        collection(getClientFirestore(), "users", uid, "favorites"),
      );
      const favorites: FavoritePc[] = [];
      for (const favoriteSnap of snap.docs) {
        const data = favoriteSnap.data();
        favorites.push({
          userId: favoriteSnap.id,
          addedAt: timestampToIso(data.createdAt),
        });
      }
      return favorites.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    },

    async addFavorite(uid, targetUserId, targetUsername) {
      await setDoc(
        doc(getClientFirestore(), "users", uid, "favorites", targetUserId),
        {
          targetUsername,
          createdAt: serverTimestamp(),
        },
      );
    },

    async removeFavorite(uid, targetUserId) {
      await deleteDoc(
        doc(getClientFirestore(), "users", uid, "favorites", targetUserId),
      );
    },

    async listBbsNotes(max = 100) {
      const snap = await getDocs(
        query(
          collection(getClientFirestore(), "bbsNotes"),
          orderBy("createdAt", "desc"),
          limit(max),
        ),
      );
      const notes: BbsPost[] = [];
      for (const noteSnap of snap.docs) {
        const data = noteSnap.data();
        const username =
          typeof data.username === "string" ? data.username : "unknown";
        const title = typeof data.title === "string" ? data.title : "";
        const body = typeof data.body === "string" ? data.body : "";
        const deletedRaw = data.deletedAt;
        const deletedAt =
          deletedRaw == null ? undefined : timestampToIso(deletedRaw);
        notes.push({
          id: noteSnap.id,
          authorId: username,
          title,
          content: body,
          createdAt: timestampToIso(data.createdAt),
          ...(deletedAt ? { deletedAt } : {}),
        });
      }
      return notes;
    },

    async createBbsNote(input) {
      const ref = doc(collection(getClientFirestore(), "bbsNotes"));
      const createdAt = new Date().toISOString();
      await setDoc(ref, {
        authorUid: input.authorUid,
        username: input.username,
        title: input.title,
        body: input.body,
        createdAt: serverTimestamp(),
        deletedAt: null,
      });
      return {
        id: ref.id,
        authorId: input.username,
        title: input.title,
        content: input.body,
        createdAt,
      };
    },

    async softDeleteBbsNote(input) {
      const ref = doc(getClientFirestore(), "bbsNotes", input.noteId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return false;
      }
      if (snap.data()?.authorUid !== input.authorUid) {
        return false;
      }
      await updateDoc(ref, { deletedAt: serverTimestamp() });
      return true;
    },

    async listStoryComments(documentId, max = 100) {
      const snap = await getDocs(
        query(
          collection(getClientFirestore(), "storyComments"),
          where("documentId", "==", documentId),
          orderBy("createdAt", "desc"),
          limit(max),
        ),
      );
      return snap.docs.map((commentSnap) =>
        storyCommentFromSnap(commentSnap.id, commentSnap.data()),
      );
    },

    async createStoryComment(input) {
      const ref = doc(collection(getClientFirestore(), "storyComments"));
      const createdAt = new Date().toISOString();
      await setDoc(ref, {
        documentId: input.documentId,
        ownerUid: input.ownerUid,
        authorUid: input.authorUid,
        username: input.username,
        content: input.content,
        createdAt: serverTimestamp(),
        deletedAt: null,
      });
      return {
        id: ref.id,
        documentId: input.documentId,
        authorId: input.username,
        content: input.content,
        createdAt,
      };
    },

    async softDeleteStoryComment(input) {
      const ref = doc(getClientFirestore(), "storyComments", input.commentId);
      const snap = await getDoc(ref);
      if (!snap.exists() || snap.data()?.authorUid !== input.authorUid) {
        return false;
      }
      await updateDoc(ref, { deletedAt: serverTimestamp() });
      return true;
    },

    async listGuestbookEntries(hostUserId, max = 100) {
      // Prefer hostUsername (stable public id); fall back to hostUid for older docs.
      const db = getClientFirestore();
      const byUsername = await getDocs(
        query(
          collection(db, "guestbookEntries"),
          where("hostUsername", "==", hostUserId),
          orderBy("createdAt", "desc"),
          limit(max),
        ),
      );
      if (!byUsername.empty) {
        return byUsername.docs.map((entrySnap) =>
          guestbookFromSnap(entrySnap.id, entrySnap.data()),
        );
      }
      const byUid = await getDocs(
        query(
          collection(db, "guestbookEntries"),
          where("hostUid", "==", hostUserId),
          orderBy("createdAt", "desc"),
          limit(max),
        ),
      );
      return byUid.docs.map((entrySnap) =>
        guestbookFromSnap(entrySnap.id, entrySnap.data()),
      );
    },

    async createGuestbookEntry(input) {
      const ref = doc(collection(getClientFirestore(), "guestbookEntries"));
      const createdAt = new Date().toISOString();
      await setDoc(ref, {
        hostUid: input.hostUid,
        hostUsername: input.hostUsername,
        authorUid: input.authorUid,
        username: input.username,
        content: input.content,
        createdAt: serverTimestamp(),
        deletedAt: null,
      });
      return {
        id: ref.id,
        hostUserId: input.hostUsername,
        authorId: input.username,
        content: input.content,
        createdAt,
      };
    },

    async softDeleteGuestbookEntry(input) {
      const ref = doc(getClientFirestore(), "guestbookEntries", input.entryId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return false;
      }
      const data = snap.data();
      // Client already authorized host/author; Security Rules harden later.
      if (input.asHost || data?.authorUid === input.actorUid) {
        await updateDoc(ref, { deletedAt: serverTimestamp() });
        return true;
      }
      return false;
    },

    async listPublicStories(max = 100) {
      const snap = await getDocs(
        query(
          collection(getClientFirestore(), "publicStories"),
          orderBy("updatedAt", "desc"),
          limit(max),
        ),
      );
      const stories: PublicStory[] = [];
      for (const storySnap of snap.docs) {
        const data = storySnap.data();
        const username =
          typeof data.username === "string" ? data.username : "unknown";
        const fileId =
          typeof data.fileId === "string" ? data.fileId : storySnap.id;
        const title = typeof data.title === "string" ? data.title : "Untitled";
        const excerpt =
          typeof data.excerpt === "string" ? data.excerpt : "";
        const slug = typeof data.slug === "string" ? data.slug : undefined;
        stories.push({
          id: storySnap.id,
          authorId: username,
          documentId: fileId,
          title,
          content: excerpt,
          publishedAt: timestampToIso(data.updatedAt),
          ...(slug ? { slug } : {}),
        });
      }
      return stories;
    },
  };
}

function storyCommentFromSnap(
  id: string,
  data: Record<string, unknown>,
): StoryComment {
  const deletedRaw = data.deletedAt;
  const deletedAt =
    deletedRaw == null ? undefined : timestampToIso(deletedRaw);
  return {
    id,
    documentId: typeof data.documentId === "string" ? data.documentId : "",
    authorId: typeof data.username === "string" ? data.username : "unknown",
    content: typeof data.content === "string" ? data.content : "",
    createdAt: timestampToIso(data.createdAt),
    ...(deletedAt ? { deletedAt } : {}),
  };
}

function guestbookFromSnap(
  id: string,
  data: Record<string, unknown>,
): GuestbookEntry {
  const deletedRaw = data.deletedAt;
  const deletedAt =
    deletedRaw == null ? undefined : timestampToIso(deletedRaw);
  return {
    id,
    hostUserId:
      typeof data.hostUsername === "string" && data.hostUsername.length > 0
        ? data.hostUsername
        : typeof data.hostUid === "string"
          ? data.hostUid
          : "",
    authorId: typeof data.username === "string" ? data.username : "unknown",
    content: typeof data.content === "string" ? data.content : "",
    createdAt: timestampToIso(data.createdAt),
    ...(deletedAt ? { deletedAt } : {}),
  };
}
