"use client";

import { getCurrentAuthUser, subscribeAuthState } from "@/lib/firebase/auth";
import { getDesktopRepository } from "@/lib/repository";
import type { DesktopThemeState } from "@/lib/repository/DesktopRepository";
import type { DesktopIcon, TextDocument } from "@/types/desktop";
import type { UserProfile } from "@/types/network";

let suppressRemotePersist = false;
let themeSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingTheme: DesktopThemeState | null = null;
let layoutSaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingLayout: { icons: DesktopIcon[]; documents: TextDocument[] } | null =
  null;
let pendingProfile: UserProfile | null = null;
let authFlushListening = false;

const THEME_SAVE_DEBOUNCE_MS = 400;
const LAYOUT_SAVE_DEBOUNCE_MS = 500;

function logRemotePersistError(scope: string, err: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[remoteDesktopPersist] ${scope} failed`, err);
  }
}

/** Skip Firestore writes while applying a loaded desktop (avoids echo writes). */
export function withRemotePersistSuppressed(fn: () => void): void {
  suppressRemotePersist = true;
  try {
    fn();
  } finally {
    suppressRemotePersist = false;
  }
}

function signedInUid(): string | null {
  try {
    return getCurrentAuthUser()?.uid ?? null;
  } catch {
    return null;
  }
}

/** When Auth restores after a local edit, flush queued profile/theme/layout. */
function ensureAuthFlushListener(): void {
  if (authFlushListening || typeof window === "undefined") {
    return;
  }
  authFlushListening = true;
  try {
    subscribeAuthState((user) => {
      if (!user || suppressRemotePersist) {
        return;
      }
      flushPendingRemotePersists();
    });
  } catch {
    authFlushListening = false;
  }
}

/** Flush any saves that waited for Auth (also safe to call after hydrate). */
export function flushPendingRemotePersists(): void {
  if (suppressRemotePersist) {
    return;
  }
  if (pendingProfile) {
    const profile = pendingProfile;
    pendingProfile = null;
    scheduleRemoteProfileSave(profile);
  }
  if (pendingTheme) {
    flushRemoteThemeSave();
  }
  if (pendingLayout) {
    flushRemoteDesktopLayoutSave();
  }
}

export type RemoteProfileSaveStatus =
  | "saved"
  | "queued"
  | "suppressed"
  | "failed";

/**
 * Awaitable profile write used by the Profile Save button so failures are visible.
 * Also used by fire-and-forget `scheduleRemoteProfileSave`.
 */
export async function saveRemoteProfileNow(
  profile: UserProfile,
): Promise<RemoteProfileSaveStatus> {
  if (suppressRemotePersist) {
    return "suppressed";
  }
  const uid = signedInUid();
  if (!uid) {
    pendingProfile = profile;
    ensureAuthFlushListener();
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[remoteDesktopPersist] saveProfile queued — Firebase Auth has no current user (local session only).",
      );
    }
    return "queued";
  }
  pendingProfile = null;
  try {
    await getDesktopRepository().saveProfile(uid, profile);
    return "saved";
  } catch (err) {
    logRemotePersistError("saveProfile", err);
    return "failed";
  }
}

export function scheduleRemoteProfileSave(profile: UserProfile): void {
  void saveRemoteProfileNow(profile);
}

export function scheduleRemoteThemeSave(theme: DesktopThemeState): void {
  if (suppressRemotePersist) {
    return;
  }
  const uid = signedInUid();
  if (!uid) {
    pendingTheme = theme;
    ensureAuthFlushListener();
    return;
  }
  pendingTheme = theme;
  if (themeSaveTimer) {
    clearTimeout(themeSaveTimer);
  }
  themeSaveTimer = setTimeout(() => {
    themeSaveTimer = null;
    const next = pendingTheme;
    pendingTheme = null;
    if (!next) {
      return;
    }
    const currentUid = signedInUid();
    if (!currentUid) {
      pendingTheme = next;
      ensureAuthFlushListener();
      return;
    }
    void getDesktopRepository()
      .saveTheme(currentUid, next)
      .catch((err) => {
        logRemotePersistError("saveTheme", err);
      });
  }, THEME_SAVE_DEBOUNCE_MS);
}

/** Test helper / pagehide: flush a pending theme write immediately. */
export function flushRemoteThemeSave(): void {
  if (themeSaveTimer) {
    clearTimeout(themeSaveTimer);
    themeSaveTimer = null;
  }
  const next = pendingTheme;
  pendingTheme = null;
  if (!next || suppressRemotePersist) {
    return;
  }
  const uid = signedInUid();
  if (!uid) {
    pendingTheme = next;
    ensureAuthFlushListener();
    return;
  }
  void getDesktopRepository()
    .saveTheme(uid, next)
    .catch((err) => {
      logRemotePersistError("saveTheme", err);
    });
}

export function scheduleRemoteDesktopLayoutSave(
  icons: DesktopIcon[],
  documents: TextDocument[],
): void {
  if (suppressRemotePersist) {
    return;
  }
  const uid = signedInUid();
  if (!uid) {
    pendingLayout = { icons, documents };
    ensureAuthFlushListener();
    return;
  }
  pendingLayout = { icons, documents };
  if (layoutSaveTimer) {
    clearTimeout(layoutSaveTimer);
  }
  layoutSaveTimer = setTimeout(() => {
    layoutSaveTimer = null;
    const next = pendingLayout;
    pendingLayout = null;
    if (!next) {
      return;
    }
    const currentUid = signedInUid();
    if (!currentUid) {
      pendingLayout = next;
      ensureAuthFlushListener();
      return;
    }
    void getDesktopRepository()
      .saveDesktopLayout(currentUid, next.icons, next.documents)
      .catch((err) => {
        logRemotePersistError("saveDesktopLayout", err);
      });
  }, LAYOUT_SAVE_DEBOUNCE_MS);
}

export function flushRemoteDesktopLayoutSave(): void {
  if (layoutSaveTimer) {
    clearTimeout(layoutSaveTimer);
    layoutSaveTimer = null;
  }
  const next = pendingLayout;
  pendingLayout = null;
  if (!next || suppressRemotePersist) {
    return;
  }
  const uid = signedInUid();
  if (!uid) {
    pendingLayout = next;
    ensureAuthFlushListener();
    return;
  }
  void getDesktopRepository()
    .saveDesktopLayout(uid, next.icons, next.documents)
    .catch((err) => {
      logRemotePersistError("saveDesktopLayout", err);
    });
}
