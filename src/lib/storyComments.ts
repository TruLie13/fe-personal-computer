import { LOCAL_USER_ID } from "@/lib/networkSeed";
import { utcDayKey } from "@/lib/bbsNotes";
import type { StoryComment } from "@/types/network";

export const STORY_COMMENTS_STORAGE_KEY =
  "personal-computer-story-comments-v1";
/** One-time migrate from the pre-rename localStorage key. */
const LEGACY_STORY_COMMENTS_STORAGE_KEY =
  "personal-computer-story-responses-v1";

/** Body — short reaction; long critique belongs in your own Notepad. */
export const MAX_STORY_COMMENT_CHARS = 500;
/** Creates per author per UTC calendar day across all stories (resets 00:00 UTC). */
export const MAX_STORY_COMMENTS_PER_UTC_DAY = 20;

export function clampStoryCommentContent(content: string): string {
  if (content.length <= MAX_STORY_COMMENT_CHARS) {
    return content;
  }
  return content.slice(0, MAX_STORY_COMMENT_CHARS);
}

export function countStoryCommentsOnUtcDay(
  comments: ReadonlyArray<Pick<StoryComment, "createdAt" | "deletedAt">>,
  dayKey: string = utcDayKey(),
): number {
  // Includes soft-deleted comments — deletes do not refund the daily create quota.
  return comments.filter(
    (comment) => utcDayKey(comment.createdAt) === dayKey,
  ).length;
}

export function canPostStoryCommentToday(
  comments: ReadonlyArray<Pick<StoryComment, "createdAt" | "deletedAt">>,
  now: Date = new Date(),
): boolean {
  return (
    countStoryCommentsOnUtcDay(comments, utcDayKey(now)) <
    MAX_STORY_COMMENTS_PER_UTC_DAY
  );
}

function isStoryComment(value: unknown): value is StoryComment {
  if (!value || typeof value !== "object") {
    return false;
  }
  const comment = value as StoryComment;
  const deletedOk =
    comment.deletedAt === undefined || typeof comment.deletedAt === "string";
  return (
    typeof comment.id === "string" &&
    typeof comment.documentId === "string" &&
    typeof comment.authorId === "string" &&
    typeof comment.content === "string" &&
    typeof comment.createdAt === "string" &&
    deletedOk
  );
}

function parseCommentList(raw: string | null): StoryComment[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(isStoryComment)
      .filter((comment) => comment.authorId === LOCAL_USER_ID);
  } catch {
    return [];
  }
}

export function loadLocalStoryComments(): StoryComment[] {
  if (typeof window === "undefined") {
    return [];
  }

  const current = parseCommentList(
    window.localStorage.getItem(STORY_COMMENTS_STORAGE_KEY),
  );
  if (current.length > 0) {
    return current;
  }

  const legacy = parseCommentList(
    window.localStorage.getItem(LEGACY_STORY_COMMENTS_STORAGE_KEY),
  );
  if (legacy.length > 0) {
    saveLocalStoryComments(legacy);
    window.localStorage.removeItem(LEGACY_STORY_COMMENTS_STORAGE_KEY);
  }
  return legacy;
}

export function saveLocalStoryComments(comments: StoryComment[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const localOnly = comments.filter(
    (comment) => comment.authorId === LOCAL_USER_ID,
  );
  window.localStorage.setItem(
    STORY_COMMENTS_STORAGE_KEY,
    JSON.stringify(localOnly),
  );
}
