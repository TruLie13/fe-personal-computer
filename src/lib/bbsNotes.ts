import {
  MAX_BBS_NOTE_CHARS,
  MAX_BBS_NOTE_TITLE_CHARS,
  MAX_BBS_NOTES_PER_UTC_DAY,
} from "@/lib/contentLimits";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import { utcDayKey } from "@/lib/utcDay";
import type { BbsPost } from "@/types/network";

export {
  MAX_BBS_NOTE_CHARS,
  MAX_BBS_NOTE_TITLE_CHARS,
  MAX_BBS_NOTES_PER_UTC_DAY,
} from "@/lib/contentLimits";
export { utcDayKey } from "@/lib/utcDay";

export const BBS_NOTES_STORAGE_KEY = "personal-computer-bbs-notes-v1";

/** Collapsed post preview — caps height from long bodies or one-char-per-line spam. */
export const MAX_BBS_COLLAPSED_LINES = 5;
export const MAX_BBS_COLLAPSED_CHARS = 320;

/**
 * Whether the board should offer Read more for this body.
 * Line count matters as much as chars (pathological newlines).
 */
export function bbsPostNeedsCollapse(content: string): boolean {
  if (content.length > MAX_BBS_COLLAPSED_CHARS) {
    return true;
  }
  return content.split("\n").length > MAX_BBS_COLLAPSED_LINES;
}

/** Preview text for a collapsed post (lines first, then chars). */
export function collapseBbsPostContent(content: string): string {
  const lines = content.split("\n");
  let preview = lines.slice(0, MAX_BBS_COLLAPSED_LINES).join("\n");
  if (preview.length > MAX_BBS_COLLAPSED_CHARS) {
    preview = preview.slice(0, MAX_BBS_COLLAPSED_CHARS);
  }
  return preview;
}

export function countBbsNotesOnUtcDay(
  notes: ReadonlyArray<Pick<BbsPost, "createdAt">>,
  dayKey: string = utcDayKey(),
): number {
  // Includes soft-deleted posts — deletes do not refund the daily create quota.
  return notes.filter((note) => utcDayKey(note.createdAt) === dayKey).length;
}

export function canPostBbsNoteToday(
  notes: ReadonlyArray<Pick<BbsPost, "createdAt">>,
  now: Date = new Date(),
): boolean {
  return (
    countBbsNotesOnUtcDay(notes, utcDayKey(now)) < MAX_BBS_NOTES_PER_UTC_DAY
  );
}

export function clampBbsNoteTitle(title: string): string {
  if (title.length <= MAX_BBS_NOTE_TITLE_CHARS) {
    return title;
  }
  return title.slice(0, MAX_BBS_NOTE_TITLE_CHARS);
}

export function clampBbsNoteContent(content: string): string {
  if (content.length <= MAX_BBS_NOTE_CHARS) {
    return content;
  }
  return content.slice(0, MAX_BBS_NOTE_CHARS);
}

function isBbsPost(value: unknown): value is BbsPost {
  if (!value || typeof value !== "object") {
    return false;
  }
  const post = value as BbsPost;
  const deletedOk =
    post.deletedAt === undefined || typeof post.deletedAt === "string";
  return (
    typeof post.id === "string" &&
    typeof post.authorId === "string" &&
    typeof post.title === "string" &&
    typeof post.content === "string" &&
    typeof post.createdAt === "string" &&
    deletedOk
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
