import type { UserProfile } from "@/types/network";
import { profileMetaTitle } from "@/lib/seo/brand";

export const PROFILE_STORAGE_KEY = "personal-computer-profile-v1";

/** Profile bio body (abuse + SEO payload size). */
export const MAX_BIO_CHARS = 500;
/** Shown as `{Name}'s Computer` — not the URL. */
export const MAX_DISPLAY_NAME_CHARS = 25;
/**
 * Win95-style PC name (`WRITER-PC`). Not the public URL — that is `username`
 * (2–20 chars). Soft cap for when computerName becomes editable.
 */
export const MAX_COMPUTER_NAME_CHARS = 24;

export function clampDisplayName(value: string): string {
  if (value.length <= MAX_DISPLAY_NAME_CHARS) {
    return value;
  }
  return value.slice(0, MAX_DISPLAY_NAME_CHARS);
}

export function clampComputerName(value: string): string {
  const upper = value.toUpperCase();
  if (upper.length <= MAX_COMPUTER_NAME_CHARS) {
    return upper;
  }
  return upper.slice(0, MAX_COMPUTER_NAME_CHARS);
}

export function clampBio(value: string): string {
  if (value.length <= MAX_BIO_CHARS) {
    return value;
  }
  return value.slice(0, MAX_BIO_CHARS);
}

export const DEFAULT_LOCAL_PROFILE: UserProfile = {
  displayName: "Writer",
  computerName: "WRITER-PC",
  bio: "This is my PC on Teal95.\n\nI write here. Visit Network Neighborhood to meet others, or leave a post on the Bulletin Board.",
  avatarColor: "#000080",
  avatarUrl: null,
};

/** Desktop identity label — matches spoken “Maya’s PC” branding. */
export function computerLabel(displayName: string): string {
  const name = displayName.trim() || DEFAULT_LOCAL_PROFILE.displayName;
  return profileMetaTitle(name);
}

export function loadLocalProfile(): UserProfile {
  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_PROFILE;
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_LOCAL_PROFILE;
    }
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      displayName:
        typeof parsed.displayName === "string" && parsed.displayName.trim()
          ? clampDisplayName(parsed.displayName.trim())
          : DEFAULT_LOCAL_PROFILE.displayName,
      computerName:
        typeof parsed.computerName === "string" && parsed.computerName.trim()
          ? clampComputerName(parsed.computerName.trim())
          : DEFAULT_LOCAL_PROFILE.computerName,
      bio:
        typeof parsed.bio === "string"
          ? clampBio(parsed.bio)
          : DEFAULT_LOCAL_PROFILE.bio,
      avatarColor:
        typeof parsed.avatarColor === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(parsed.avatarColor)
          ? parsed.avatarColor.toLowerCase()
          : DEFAULT_LOCAL_PROFILE.avatarColor,
      avatarUrl:
        typeof parsed.avatarUrl === "string" && parsed.avatarUrl.trim()
          ? parsed.avatarUrl.trim()
          : null,
    };
  } catch {
    return DEFAULT_LOCAL_PROFILE;
  }
}

export function saveLocalProfile(profile: UserProfile): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}
