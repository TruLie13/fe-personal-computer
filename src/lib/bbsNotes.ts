import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { BbsPost } from "@/types/network";

export const BBS_NOTES_STORAGE_KEY = "personal-computer-bbs-notes-v1";

function isBbsPost(value: unknown): value is BbsPost {
  if (!value || typeof value !== "object") {
    return false;
  }
  const post = value as BbsPost;
  return (
    typeof post.id === "string" &&
    typeof post.authorId === "string" &&
    typeof post.title === "string" &&
    typeof post.content === "string" &&
    typeof post.createdAt === "string"
  );
}

export function loadLocalBbsNotes(): BbsPost[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(BBS_NOTES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isBbsPost).filter((post) => post.authorId === LOCAL_USER_ID);
  } catch {
    return [];
  }
}

export function saveLocalBbsNotes(notes: BbsPost[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const localOnly = notes.filter((post) => post.authorId === LOCAL_USER_ID);
  window.localStorage.setItem(BBS_NOTES_STORAGE_KEY, JSON.stringify(localOnly));
}
