import { notifyOwnPcChanged } from "@/lib/ownPc";
import { useDesktopStore } from "@/store/desktopStore";

export const LOCAL_SESSION_STORAGE_KEY = "personal-computer-local-session-v1";

export const USERNAME_PATTERN = /^[a-z][a-z0-9_-]{1,19}$/;

export interface LocalSession {
  username: string;
  email: string;
  createdAt: string;
}

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

function isLocalSession(value: unknown): value is LocalSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.username === "string" &&
    typeof record.email === "string" &&
    typeof record.createdAt === "string"
  );
}

export function loadLocalSession(): LocalSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isLocalSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLocalSession(session: LocalSession): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    LOCAL_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

/**
 * Frontend-only signup: stamp the local profile and a stub session.
 * Password is never stored. Email is kept on the stub session only.
 */
export function applyLocalSetupAccount(input: LocalSetupInput): void {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim() || username;
  const computerName = `${username.toUpperCase()}-PC`;

  useDesktopStore.getState().updateLocalProfile({
    displayName,
    computerName,
  });

  saveLocalSession({
    username,
    email: input.email.trim(),
    createdAt: new Date().toISOString(),
  });
  notifyOwnPcChanged();
}
