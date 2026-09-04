"use client";

import { getCurrentAuthUser } from "@/lib/firebase/auth";

async function bearerHeaders(): Promise<HeadersInit> {
  const user = getCurrentAuthUser();
  if (!user) {
    throw new Error("Not signed in");
  }
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export class SocialApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SocialApiError";
    this.status = status;
    this.code = code;
  }
}

async function postSocialJson<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: await bearerHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    throw new SocialApiError(
      payload.error ?? `Request failed (${response.status})`,
      response.status,
      payload.code,
    );
  }
  return payload as T;
}

export async function apiCreateBbsNote(input: {
  username: string;
  title: string;
  body: string;
}): Promise<{
  id: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
}> {
  return postSocialJson("/api/social/bbs", input);
}

export async function apiCreateStoryComment(input: {
  username: string;
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
  return postSocialJson("/api/social/comments", input);
}

export async function apiCreateGuestbookEntry(input: {
  username: string;
  hostUid: string;
  hostUsername: string;
  content: string;
}): Promise<{
  id: string;
  hostUserId: string;
  authorId: string;
  content: string;
  createdAt: string;
}> {
  return postSocialJson("/api/social/guestbook", input);
}
