import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { BbsPost } from "@/types/network";

export const BBS_NOTES_STORAGE_KEY = "personal-computer-bbs-notes-v1";

/** Subject line — already mirrored by the compose `maxLength`. */
export const MAX_BBS_NOTE_TITLE_CHARS = 80;
/** Body — short post length; long writing belongs in Notepad. */
export const MAX_BBS_NOTE_CHARS = 1_000;
/** Creates per author per UTC calendar day (resets 00:00 UTC). */
export const MAX_BBS_NOTES_PER_UTC_DAY = 5;

/** `YYYY-MM-DD` for the given instant in UTC. */
export function utcDayKey(isoOrDate: string | Date = new Date()): string {
  const date =
    typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export function countBbsNotesOnUtcDay(
  notes: ReadonlyArray<Pick<BbsPost, "createdAt">>,
  dayKey: string = utcDayKey(),
): number {
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
