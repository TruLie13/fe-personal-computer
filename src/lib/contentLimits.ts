/**
 * Single source of truth for content length + UTC-day quotas.
 * Firestore rules and server quota checks must mirror these numbers
 * (see `contentLimits.rulesParity.test.ts` and `firestore.rules`).
 */
export const CONTENT_LIMITS = {
  bioChars: 500,
  displayNameChars: 25,
  computerNameChars: 24,
  fileTitleChars: 120,
  textFileChars: 20_000,
  textFilesPerUser: 50,
  foldersPerUser: 25,
  bbsTitleChars: 80,
  bbsBodyChars: 1_000,
  bbsNotesPerUtcDay: 5,
  storyCommentChars: 500,
  storyCommentsPerUtcDay: 20,
  guestbookEntryChars: 400,
  guestbookSignsPerHostPerUtcDay: 3,
  publicStoryExcerptChars: 400,
  taskbarHeightMin: 28,
  taskbarHeightMax: 72,
  taskbarHeightDefault: 36,
} as const;

export type ContentLimits = typeof CONTENT_LIMITS;

/** Named aliases matching older call sites / docs. */
export const MAX_BIO_CHARS = CONTENT_LIMITS.bioChars;
export const MAX_DISPLAY_NAME_CHARS = CONTENT_LIMITS.displayNameChars;
export const MAX_COMPUTER_NAME_CHARS = CONTENT_LIMITS.computerNameChars;
export const MAX_FILE_TITLE_CHARS = CONTENT_LIMITS.fileTitleChars;
export const MAX_TEXT_FILE_CHARS = CONTENT_LIMITS.textFileChars;
export const MAX_TEXT_FILES_PER_USER = CONTENT_LIMITS.textFilesPerUser;
export const MAX_FOLDERS_PER_USER = CONTENT_LIMITS.foldersPerUser;
export const MAX_BBS_NOTE_TITLE_CHARS = CONTENT_LIMITS.bbsTitleChars;
export const MAX_BBS_NOTE_CHARS = CONTENT_LIMITS.bbsBodyChars;
export const MAX_BBS_NOTES_PER_UTC_DAY = CONTENT_LIMITS.bbsNotesPerUtcDay;
export const MAX_STORY_COMMENT_CHARS = CONTENT_LIMITS.storyCommentChars;
export const MAX_STORY_COMMENTS_PER_UTC_DAY =
  CONTENT_LIMITS.storyCommentsPerUtcDay;
export const MAX_GUESTBOOK_ENTRY_CHARS = CONTENT_LIMITS.guestbookEntryChars;
export const MAX_GUESTBOOK_SIGNS_PER_HOST_PER_UTC_DAY =
  CONTENT_LIMITS.guestbookSignsPerHostPerUtcDay;
export const MIN_TASKBAR_HEIGHT = CONTENT_LIMITS.taskbarHeightMin;
export const MAX_TASKBAR_HEIGHT = CONTENT_LIMITS.taskbarHeightMax;
export const DEFAULT_TASKBAR_HEIGHT = CONTENT_LIMITS.taskbarHeightDefault;
