import { notifyOwnPcChanged } from "@/lib/ownPc";
import {
  saveLocalSession,
  loadLocalSession,
  LOCAL_SESSION_STORAGE_KEY,
} from "@/lib/localSession";
import { withRemotePersistSuppressed } from "@/lib/remoteDesktopPersist";
import { DOCUMENTS_FOLDER_ID } from "@/lib/repository/desktopFiles";
import { isAppIcon, mergeAppIcons } from "@/lib/storage";
import { useDesktopStore } from "@/store/desktopStore";
import { commitDesktopPatch } from "@/store/desktopWrite";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type { UserProfile } from "@/types/network";

export { loadLocalSession, LOCAL_SESSION_STORAGE_KEY };

export const USERNAME_PATTERN = /^[a-z][a-z0-9_-]{1,19}$/;

export interface LocalSetupInput {
  username: string;
  email: string;
  displayName: string;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function usernameError(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (!username) {
    return "Type a username.";
  }
  if (!/^[a-z]/.test(username)) {
    return "Username must start with a letter.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use 2–20 letters, numbers, hyphens, or underscores.";
  }
  return null;
}

export function emailError(raw: string): string | null {
  const email = raw.trim();
  if (!email) {
    return "Type an e-mail address.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Type a valid e-mail address.";
  }
  return null;
}

export function passwordError(raw: string): string | null {
  if (!raw) {
    return "Type a password.";
  }
  if (raw.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

export function userInfoError(input: {
  username: string;
  email: string;
  password: string;
}): string | null {
  return (
    usernameError(input.username) ??
    emailError(input.email) ??
    passwordError(input.password)
  );
}

export function analyzingStatus(progress: number): string {
  if (progress < 25) {
    return "Creating your user folder...";
  }
  if (progress < 50) {
    return "Installing Notepad...";
  }
  if (progress < 75) {
    return "Connecting to Network Neighborhood...";
  }
  if (progress < 100) {
    return "Starting your computer...";
  }
  return "Setup is complete.";
}

export function applySignedInSession(input: {
  username: string;
  email: string;
  profile?: Partial<UserProfile>;
  theme?: {
    wallpaper: string;
    titleBarColor: string;
    contentDark: boolean;
    taskbarHeight?: number;
  };
  /** Firestore FS nodes (folders + text). Merged with local app icon positions. */
  fs?: {
    icons: DesktopIcon[];
    documents: TextDocument[];
  };
}): void {
  const username = normalizeUsername(input.username);
  const displayName = input.profile?.displayName?.trim() || username;
  const computerName =
    input.profile?.computerName?.trim() || `${username.toUpperCase()}-PC`;

  withRemotePersistSuppressed(() => {
    const store = useDesktopStore.getState();
    store.updateLocalProfile({
      displayName,
      computerName,
      ...(input.profile?.bio !== undefined ? { bio: input.profile.bio } : {}),
      ...(input.profile?.avatarColor !== undefined
        ? { avatarColor: input.profile.avatarColor }
        : {}),
      ...(input.profile?.avatarUrl !== undefined
        ? { avatarUrl: input.profile.avatarUrl }
        : {}),
    });

    if (input.theme) {
      store.setWallpaper(input.theme.wallpaper);
      store.setTitleBarColor(input.theme.titleBarColor);
      store.setContentDark(input.theme.contentDark);
      if (typeof input.theme.taskbarHeight === "number") {
        store.setTaskbarHeight(input.theme.taskbarHeight);
      }
    }

    if (input.fs) {
      const state = useDesktopStore.getState();
      const appIcons = state.icons.filter(
        (icon) => isAppIcon(icon.id) && icon.id !== DOCUMENTS_FOLDER_ID,
      );
      const icons = mergeAppIcons([...appIcons, ...input.fs.icons]);
      useDesktopStore.setState(
        commitDesktopPatch(state, {
          icons,
          documents: input.fs.documents,
        }),
      );
    }
  });

  saveLocalSession({
    username,
    email: input.email.trim(),
    createdAt: new Date().toISOString(),
  });
  notifyOwnPcChanged();
}

/**
 * Frontend-only signup: stamp the local profile and a stub session.
 * Password is never stored. Email is kept on the stub session only.
 */
export function applyLocalSetupAccount(input: LocalSetupInput): void {
  applySignedInSession({
    username: input.username,
    email: input.email,
    profile: { displayName: input.displayName },
  });
}
