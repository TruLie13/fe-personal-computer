import {
  CONTENT_LIMITS,
  MAX_FILE_TITLE_CHARS,
  MAX_FOLDERS_PER_USER,
  MAX_TEXT_FILE_CHARS,
  MAX_TEXT_FILES_PER_USER,
} from "@/lib/contentLimits";
import type { DesktopIcon, TextDocument } from "@/types/desktop";

export type DesktopFsLimitKind =
  | "textFiles"
  | "folders"
  | "fileTitle"
  | "fileContent";

export class DesktopFsLimitError extends Error {
  readonly kind: DesktopFsLimitKind;
  readonly used: number;
  readonly max: number;

  constructor(kind: DesktopFsLimitKind, used: number, max: number) {
    super(`Desktop ${kind} limit exceeded (${used}/${max}).`);
    this.name = "DesktopFsLimitError";
    this.kind = kind;
    this.used = used;
    this.max = max;
  }
}

export function isDesktopFsLimitError(
  value: unknown,
): value is DesktopFsLimitError {
  return value instanceof DesktopFsLimitError;
}

export function countTextFiles(documents: ReadonlyArray<TextDocument>): number {
  return documents.length;
}

export function countFolders(
  icons: ReadonlyArray<{ type: string }>,
): number {
  return icons.filter((icon) => icon.type === "folder").length;
}

/** Reject snapshots that exceed FE contentLimits (server re-check). */
export function assertDesktopFsWithinLimits(
  icons: ReadonlyArray<DesktopIcon>,
  documents: ReadonlyArray<TextDocument>,
): void {
  const textCount = countTextFiles(documents);
  if (textCount > MAX_TEXT_FILES_PER_USER) {
    throw new DesktopFsLimitError(
      "textFiles",
      textCount,
      MAX_TEXT_FILES_PER_USER,
    );
  }

  const folderCount = countFolders(icons);
  if (folderCount > MAX_FOLDERS_PER_USER) {
    throw new DesktopFsLimitError(
      "folders",
      folderCount,
      MAX_FOLDERS_PER_USER,
    );
  }

  for (const document of documents) {
    if (document.title.length > MAX_FILE_TITLE_CHARS) {
      throw new DesktopFsLimitError(
        "fileTitle",
        document.title.length,
        MAX_FILE_TITLE_CHARS,
      );
    }
    if (document.content.length > MAX_TEXT_FILE_CHARS) {
      throw new DesktopFsLimitError(
        "fileContent",
        document.content.length,
        MAX_TEXT_FILE_CHARS,
      );
    }
  }
}

export function publicStoryExcerpt(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  const max = Math.min(200, CONTENT_LIMITS.publicStoryExcerptChars);
  if (flat.length <= max) {
    return flat;
  }
  return `${flat.slice(0, max - 1)}…`;
}
