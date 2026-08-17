import type { UserProfile } from "@/types/network";
import { profileMetaTitle } from "@/lib/seo/brand";

export const PROFILE_STORAGE_KEY = "personal-computer-profile-v1";

export const DEFAULT_LOCAL_PROFILE: UserProfile = {
  displayName: "Writer",
  computerName: "WRITER-PC",
  bio: "This is my PC on MyPC.\n\nI write here. Visit Network Neighborhood to meet others, or leave a note on the Bulletin Board.",
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
          ? parsed.displayName.trim()
          : DEFAULT_LOCAL_PROFILE.displayName,
      computerName:
        typeof parsed.computerName === "string" && parsed.computerName.trim()
          ? parsed.computerName.trim().toUpperCase()
          : DEFAULT_LOCAL_PROFILE.computerName,
      bio:
        typeof parsed.bio === "string"
          ? parsed.bio
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
