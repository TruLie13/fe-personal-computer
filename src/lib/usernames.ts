import { normalizeUsername, usernameError } from "@/lib/setupAccount";

/** Usernames that must never be claimed — app routes, stubs, and system names. */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "bbs",
  "c",
  "desktop",
  "edit",
  "f",
  "favorites",
  "local",
  "maya",
  "network",
  "new",
  "null",
  "profile",
  "rex",
  "setup",
  "sign-in",
  "signin",
  "stories",
  "undefined",
  "user",
  "users",
  "www",
]);

export const USERNAME_UNAVAILABLE_MESSAGE =
  "That username is not available.";

export const USERNAME_TAKEN_MESSAGE = "That username is already taken.";

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

/** Sync validation for username field blur — format + reserved names only. */
export function usernameBlurError(raw: string): string | null {
  const formatError = usernameError(raw);
  if (formatError) {
    return formatError;
  }
  if (isReservedUsername(normalizeUsername(raw))) {
    return USERNAME_UNAVAILABLE_MESSAGE;
  }
  return null;
}
