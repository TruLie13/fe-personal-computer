import { sessionUsername } from "@/lib/localSession";
import { LOCAL_USER_ID } from "@/lib/networkSeed";
import type { NetworkUserId } from "@/types/network";

export function siteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  return "http://localhost:3000";
}

/** Logged-in user's public username (stub until auth). */
export function currentUsername(): string {
  return LOCAL_USER_ID;
}

/** Canonical home desktop for the signed-in user. */
export function homePath(): string {
  return profilePath(currentUsername());
}

/** Client-only: `/C/users/{claimed}` after Setup, else stub `/C/users/local`. */
export function clientHomePath(): string {
  return profilePath(sessionUsername() ?? currentUsername());
}

export function profilePath(username: NetworkUserId | string): string {
  return `/C/users/${encodeURIComponent(username)}`;
}

export function filePath(
  username: NetworkUserId | string,
  fileSlug: string,
): string {
  return `/C/users/${encodeURIComponent(username)}/${encodeURIComponent(fileSlug)}`;
}

export function profileUrl(username: NetworkUserId | string): string {
  return `${siteOrigin()}${profilePath(username)}`;
}

export function fileUrl(
  username: NetworkUserId | string,
  fileSlug: string,
): string {
  return `${siteOrigin()}${filePath(username, fileSlug)}`;
}

export function isLocalUsername(username: string): boolean {
  return username === LOCAL_USER_ID;
}

export function signInPath(): string {
  return "/sign-in";
}

/** Local Setup Wizard (Get your PC). */
export function setupPath(): string {
  return "/setup";
}

/** Public sample PC for guests exploring before signup. */
export function samplePcPath(): string {
  return profilePath("maya");
}
