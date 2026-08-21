import { utcDayKey } from "@/lib/bbsNotes";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { GuestbookEntry, NetworkUserId } from "@/types/network";

export const GUESTBOOK_STORAGE_KEY = "personal-computer-guestbook-v1";

/** Short guestbook note — longer writing belongs in Notepad / Comments. */
export const MAX_GUESTBOOK_ENTRY_CHARS = 400;
/** Signs by one visitor on one host PC per UTC calendar day. */
export const MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY = 3;

export function clampGuestbookEntryContent(content: string): string {
  if (content.length <= MAX_GUESTBOOK_ENTRY_CHARS) {
    return content;
  }
  return content.slice(0, MAX_GUESTBOOK_ENTRY_CHARS);
}

export function countGuestbookSignsOnHostUtcDay(
  entries: ReadonlyArray<
    Pick<GuestbookEntry, "hostUserId" | "authorId" | "createdAt" | "deletedAt">
  >,
  hostUserId: NetworkUserId,
  authorId: NetworkUserId,
  dayKey: string = utcDayKey(),
): number {
  return entries.filter(
    (entry) =>
      entry.hostUserId === hostUserId &&
      entry.authorId === authorId &&
      utcDayKey(entry.createdAt) === dayKey,
  ).length;
}

export function canSignGuestbookToday(
  entries: ReadonlyArray<
    Pick<GuestbookEntry, "hostUserId" | "authorId" | "createdAt" | "deletedAt">
  >,
  hostUserId: NetworkUserId,
  authorId: NetworkUserId = LOCAL_USER_ID,
  now: Date = new Date(),
): boolean {
  return (
    countGuestbookSignsOnHostUtcDay(
      entries,
      hostUserId,
      authorId,
      utcDayKey(now),
    ) < MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY
  );
}

function isGuestbookEntry(value: unknown): value is GuestbookEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as GuestbookEntry;
  const deletedOk =
    entry.deletedAt === undefined || typeof entry.deletedAt === "string";
  return (
    typeof entry.id === "string" &&
    typeof entry.hostUserId === "string" &&
    typeof entry.authorId === "string" &&
    typeof entry.content === "string" &&
    typeof entry.createdAt === "string" &&
    deletedOk
  );
}

export function loadLocalGuestbookEntries(): GuestbookEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(GUESTBOOK_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isGuestbookEntry).filter(
      (entry) =>
        entry.authorId === LOCAL_USER_ID || entry.hostUserId === LOCAL_USER_ID,
    );
  } catch {
    return [];
  }
}

export function saveLocalGuestbookEntries(entries: GuestbookEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const relevant = entries.filter(
    (entry) =>
      entry.authorId === LOCAL_USER_ID || entry.hostUserId === LOCAL_USER_ID,
  );
  window.localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(relevant));
}
