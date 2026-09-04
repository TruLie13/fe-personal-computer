"use client";

import { getCurrentAuthUser } from "@/lib/firebase/auth";
import { sessionUsername } from "@/lib/localSession";
import { getSocialRepository } from "@/lib/repository";
import type { BbsPost, FavoritePc, GuestbookEntry, PublicStory, StoryComment } from "@/types/network";

function signedInUid(): string | null {
  try {
    return getCurrentAuthUser()?.uid ?? null;
  } catch {
    return null;
  }
}

export function scheduleAddFavorite(
  targetUserId: string,
  targetUsername: string,
): void {
  const uid = signedInUid();
  if (!uid) {
    return;
  }
  void getSocialRepository()
    .addFavorite(uid, targetUserId, targetUsername)
    .catch(() => {
      // keep local favorite
    });
}

export function scheduleRemoveFavorite(targetUserId: string): void {
  const uid = signedInUid();
  if (!uid) {
    return;
  }
  void getSocialRepository()
    .removeFavorite(uid, targetUserId)
    .catch(() => {
      // keep local removal
    });
}

export async function createRemoteBbsNote(input: {
  title: string;
  body: string;
}): Promise<BbsPost | null> {
  const uid = signedInUid();
  const username = sessionUsername();
  if (!uid || !username) {
    return null;
  }
  try {
    return await getSocialRepository().createBbsNote({
      authorUid: uid,
      username,
      title: input.title,
      body: input.body,
    });
  } catch {
    return null;
  }
}

export async function softDeleteRemoteBbsNote(noteId: string): Promise<boolean> {
  const uid = signedInUid();
  if (!uid) {
    return false;
  }
  try {
    return await getSocialRepository().softDeleteBbsNote({
      noteId,
      authorUid: uid,
    });
  } catch {
    return false;
  }
}

export async function pullRemoteBbsNotes(): Promise<BbsPost[]> {
  try {
    return await getSocialRepository().listBbsNotes();
  } catch {
    return [];
  }
}

export async function pullRemoteFavorites(): Promise<FavoritePc[]> {
  const uid = signedInUid();
  if (!uid) {
    return [];
  }
  try {
    return await getSocialRepository().loadFavorites(uid);
  } catch {
    return [];
  }
}

export async function createRemoteStoryComment(input: {
  documentId: string;
  ownerUid: string;
  content: string;
}): Promise<StoryComment | null> {
  const uid = signedInUid();
  const username = sessionUsername();
  if (!uid || !username) {
    return null;
  }
  try {
    return await getSocialRepository().createStoryComment({
      documentId: input.documentId,
      ownerUid: input.ownerUid,
      authorUid: uid,
      username,
      content: input.content,
    });
  } catch {
    return null;
  }
}

export async function softDeleteRemoteStoryComment(
  commentId: string,
): Promise<boolean> {
  const uid = signedInUid();
  if (!uid) {
    return false;
  }
  try {
    return await getSocialRepository().softDeleteStoryComment({
      commentId,
      authorUid: uid,
    });
  } catch {
    return false;
  }
}

export async function createRemoteGuestbookEntry(input: {
  hostUid: string;
  hostUsername: string;
  content: string;
}): Promise<GuestbookEntry | null> {
  const uid = signedInUid();
  const username = sessionUsername();
  if (!uid || !username) {
    return null;
  }
  try {
    return await getSocialRepository().createGuestbookEntry({
      hostUid: input.hostUid,
      hostUsername: input.hostUsername,
      authorUid: uid,
      username,
      content: input.content,
    });
  } catch {
    return null;
  }
}

export async function softDeleteRemoteGuestbookEntry(
  entryId: string,
  asHost: boolean,
): Promise<boolean> {
  const uid = signedInUid();
  if (!uid) {
    return false;
  }
  try {
    return await getSocialRepository().softDeleteGuestbookEntry({
      entryId,
      actorUid: uid,
      asHost,
    });
  } catch {
    return false;
  }
}

export async function pullRemotePublicStories(): Promise<PublicStory[]> {
  try {
    return await getSocialRepository().listPublicStories();
  } catch {
    return [];
  }
}
