"use client";

import { postAuthedJson, SocialApiError } from "@/lib/clientApi";

export { SocialApiError };

export async function apiCreateBbsNote(input: {
  title: string;
  body: string;
}): Promise<{
  id: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
}> {
  return postAuthedJson("/api/social/bbs", input);
}

export async function apiCreateStoryComment(input: {
  documentId: string;
  ownerUid: string;
  content: string;
}): Promise<{
  id: string;
  documentId: string;
  authorId: string;
  content: string;
  createdAt: string;
}> {
  return postAuthedJson("/api/social/comments", input);
}

export async function apiCreateGuestbookEntry(input: {
  hostUid: string;
  content: string;
}): Promise<{
  id: string;
  hostUserId: string;
  authorId: string;
  content: string;
  createdAt: string;
}> {
  // hostUsername is resolved server-side from hostUid.
  return postAuthedJson("/api/social/guestbook", {
    hostUid: input.hostUid,
    content: input.content,
  });
}
