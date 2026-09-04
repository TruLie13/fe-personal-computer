export const LOCAL_SESSION_STORAGE_KEY = "personal-computer-local-session-v1";

export interface LocalSession {
  username: string;
  email: string;
  createdAt: string;
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

export function clearLocalSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
}

/** Claimed username for the signed-in owner, if Setup/Sign-in has run. */
export function sessionUsername(): string | null {
  const username = loadLocalSession()?.username.trim().toLowerCase();
  return username ? username : null;
}

export function isOwnDesktopUsername(username: string): boolean {
  const own = sessionUsername();
  return own != null && own === username.trim().toLowerCase();
}
