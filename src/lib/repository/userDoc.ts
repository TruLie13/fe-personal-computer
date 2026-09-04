import {
  clampBio,
  clampComputerName,
  clampDisplayName,
  DEFAULT_LOCAL_PROFILE,
} from "@/lib/profile";
import {
  clampTaskbarHeight,
  DEFAULT_CONTENT_DARK,
  DEFAULT_TASKBAR_HEIGHT,
  DEFAULT_TITLE_BAR_COLOR,
  DEFAULT_WALLPAPER,
} from "@/lib/storage";
import type { FirestoreUserDoc } from "@/types/firestore";
import type { UserProfile } from "@/types/network";
import type { ClaimUsernameInput } from "@/lib/repository/DesktopRepository";

export function computerNameFromUsername(username: string): string {
  return clampComputerName(`${username.toUpperCase()}-PC`);
}

export function userDocFromClaim(input: ClaimUsernameInput): FirestoreUserDoc {
  const now = new Date().toISOString();
  const displayName = clampDisplayName(
    input.displayName.trim() || input.username,
  );
  return {
    username: input.username,
    displayName,
    computerName: computerNameFromUsername(input.username),
    bio: DEFAULT_LOCAL_PROFILE.bio,
    avatarColor: DEFAULT_LOCAL_PROFILE.avatarColor,
    avatarUrl: null,
    wallpaper: DEFAULT_WALLPAPER,
    titleBarColor: DEFAULT_TITLE_BAR_COLOR,
    contentDark: DEFAULT_CONTENT_DARK,
    taskbarHeight: DEFAULT_TASKBAR_HEIGHT,
    createdAt: now,
    updatedAt: now,
  };
}

export function profileFromUserDoc(doc: FirestoreUserDoc): UserProfile {
  return {
    displayName: clampDisplayName(doc.displayName),
    computerName: clampComputerName(doc.computerName),
    bio: clampBio(doc.bio),
    avatarColor: doc.avatarColor,
    avatarUrl: doc.avatarUrl,
  };
}

function isIsoString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function timestampToIso(value: unknown): string | null {
  if (isIsoString(value)) {
    return value;
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export function parseUserDoc(value: unknown): FirestoreUserDoc | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.username !== "string" || typeof record.displayName !== "string") {
    return null;
  }
  const createdAt = timestampToIso(record.createdAt) ?? new Date().toISOString();
  const updatedAt = timestampToIso(record.updatedAt) ?? createdAt;
  return {
    username: record.username,
    displayName: record.displayName,
    computerName:
      typeof record.computerName === "string"
        ? record.computerName
        : computerNameFromUsername(record.username),
    bio: typeof record.bio === "string" ? record.bio : DEFAULT_LOCAL_PROFILE.bio,
    avatarColor:
      typeof record.avatarColor === "string"
        ? record.avatarColor
        : DEFAULT_LOCAL_PROFILE.avatarColor,
    avatarUrl: typeof record.avatarUrl === "string" ? record.avatarUrl : null,
    wallpaper:
      typeof record.wallpaper === "string" ? record.wallpaper : DEFAULT_WALLPAPER,
    titleBarColor:
      typeof record.titleBarColor === "string"
        ? record.titleBarColor
        : DEFAULT_TITLE_BAR_COLOR,
    contentDark: record.contentDark === true,
    ...(typeof record.taskbarHeight === "number"
      ? { taskbarHeight: clampTaskbarHeight(record.taskbarHeight) }
      : {}),
    createdAt,
    updatedAt,
  };
}
